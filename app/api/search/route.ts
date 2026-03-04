import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { cache } from '@/lib/redis';
import { query } from '@/lib/db';
import { SearchRequest, SearchResponse, Platform } from '@/types/product';

const searchSchema = z.object({
  query: z.string().min(1).max(500),
  platforms: z.array(z.enum(['taobao', '1688', 'temu', 'amazon'])),
  filters: z.object({
    price_min: z.number().optional(),
    price_max: z.number().optional(),
    category: z.string().optional(),
    moq_max: z.number().optional(),
  }).optional(),
  page: z.number().default(1),
  limit: z.number().default(20),
});

const SERVICE_URLS: Record<Platform, string> = {
  taobao: process.env.TAOBAO_SERVICE_URL || 'http://localhost:8001',
  '1688': process.env.SERVICE_1688_URL || 'http://localhost:8002',
  temu: process.env.TEMU_SERVICE_URL || 'http://localhost:8003',
  amazon: process.env.AMAZON_SERVICE_URL || 'http://localhost:8004',
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const validated = searchSchema.parse(body);
    
    const cacheKey = `search:${JSON.stringify(validated)}`;
    const cached = await cache.get<SearchResponse>(cacheKey);
    
    if (cached) {
      return NextResponse.json(cached);
    }
    
    const promises = validated.platforms.map(async (platform) => {
      try {
        const response = await fetch(`${SERVICE_URLS[platform]}/search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: validated.query,
            page: validated.page,
            limit: validated.limit,
            ...validated.filters,
          }),
          signal: AbortSignal.timeout(60000), // 60 seconds for web scraping
        });
        
        if (!response.ok) {
          throw new Error(`${platform} service returned ${response.status}`);
        }
        
        const data = await response.json();
        return { platform, products: data.products || [], error: null };
      } catch (error) {
        console.error(`Error fetching from ${platform}:`, error);
        return { 
          platform, 
          products: [], 
          error: error instanceof Error ? error.message : 'Unknown error' 
        };
      }
    });
    
    const results = await Promise.all(promises);
    
    const allProducts = results.flatMap(r => r.products);
    const errors = results
      .filter(r => r.error)
      .reduce((acc, r) => ({ ...acc, [r.platform]: r.error }), {});
    
    const response: SearchResponse = {
      products: allProducts,
      pagination: {
        total: allProducts.length,
        page: validated.page,
        limit: validated.limit,
        hasMore: false,
      },
      metadata: {
        searchTime: Date.now() - startTime,
        platformsQueried: validated.platforms,
        platformErrors: Object.keys(errors).length > 0 ? errors : undefined,
      },
    };
    
    await cache.set(cacheKey, response, 3600);
    
    // Log search to database (optional - silently fail if DB not available)
    query(
      'INSERT INTO searches (query, platforms, filters, result_count) VALUES ($1, $2, $3, $4)',
      [validated.query, validated.platforms, validated.filters || {}, allProducts.length]
    ).catch(() => {
      // Database logging is optional
    });
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
