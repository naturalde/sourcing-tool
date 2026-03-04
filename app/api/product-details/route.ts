import { NextRequest, NextResponse } from 'next/server';

const SERVICE_URLS: Record<string, string> = {
  taobao: process.env.TAOBAO_SERVICE_URL || 'http://localhost:8001',
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const platform = searchParams.get('platform') || 'taobao'; // Default to taobao

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    // Extract numeric ID by removing platform prefix (e.g., "taobao_123" -> "123")
    const numericId = productId.includes('_') ? productId.split('_')[1] : productId;

    const serviceUrl = SERVICE_URLS[platform];
    if (!serviceUrl) {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      );
    }

    // Call the backend service to get product details
    const response = await fetch(`${serviceUrl}/product/${numericId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Service returned ${response.status}: ${errorText}`);
      throw new Error(`Service returned ${response.status}`);
    }

    const details = await response.json();
    return NextResponse.json(details);
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product details', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, productId } = body;

    if (!platform || !productId) {
      return NextResponse.json(
        { error: 'Platform and productId are required' },
        { status: 400 }
      );
    }

    // Extract numeric ID by removing platform prefix (e.g., "taobao_123" -> "123")
    const numericId = productId.includes('_') ? productId.split('_')[1] : productId;

    const serviceUrl = SERVICE_URLS[platform];
    if (!serviceUrl) {
      return NextResponse.json(
        { error: `Unsupported platform: ${platform}` },
        { status: 400 }
      );
    }

    // Call the backend service to get product details
    const response = await fetch(`${serviceUrl}/product/${numericId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`Service returned ${response.status}`);
    }

    const details = await response.json();
    return NextResponse.json(details);
  } catch (error) {
    console.error('Error fetching product details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product details' },
      { status: 500 }
    );
  }
}
