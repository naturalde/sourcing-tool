# Technical Architecture Documentation
## Multi-Platform Sourcing Assistant

**Version:** 1.0  
**Last Updated:** March 2026

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture Patterns](#2-architecture-patterns)
3. [Component Specifications](#3-component-specifications)
4. [Data Flow](#4-data-flow)
5. [API Specifications](#5-api-specifications)
6. [Database Schema](#6-database-schema)
7. [Deployment Architecture](#7-deployment-architecture)
8. [Security Architecture](#8-security-architecture)
9. [Performance Optimization](#9-performance-optimization)
10. [Monitoring & Observability](#10-monitoring--observability)

---

## 1. System Overview

### 1.1 Architecture Style

**Microservices + BFF (Backend for Frontend)**

- **Frontend**: Next.js 14 with App Router (React Server Components)
- **BFF Layer**: Next.js API Routes (orchestration, aggregation)
- **Backend Services**: Python FastAPI microservices (platform integrations)
- **Data Layer**: PostgreSQL (persistence), Redis (caching), S3/MinIO (file storage)

### 1.2 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| Next.js as BFF | Unified TypeScript codebase, server-side rendering, API routes for orchestration |
| Python microservices | Best libraries for web scraping, data processing, and external API integrations |
| FastAPI framework | Async support, automatic OpenAPI docs, high performance, type safety |
| PostgreSQL | ACID compliance for proposals, JSONB support for flexible product data |
| Redis caching | Reduce external API calls, improve response times, session management |
| Docker Compose | Simplified local development with all services |
| Kubernetes | Production scalability, service discovery, auto-scaling |

---

## 2. Architecture Patterns

### 2.1 BFF (Backend for Frontend) Pattern

```
┌─────────────────────────────────────────────┐
│           Next.js Frontend                  │
│  (React Server Components + Client)         │
└──────────────────┬──────────────────────────┘
                   │
                   │ Internal API calls
                   │
┌──────────────────▼──────────────────────────┐
│         Next.js API Routes (BFF)            │
│                                             │
│  • Request validation                       │
│  • Authentication/Authorization             │
│  • Parallel service orchestration           │
│  • Response aggregation & normalization     │
│  • Error handling & fallbacks               │
│  • Caching strategy                         │
└──────────────────┬──────────────────────────┘
                   │
                   │ HTTP/REST
                   │
        ┌──────────┼──────────┬──────────┐
        │          │          │          │
    ┌───▼───┐  ┌──▼──┐   ┌───▼───┐  ┌──▼──┐
    │Service│  │Svc 2│   │Svc 3 │  │Svc N│
    └───────┘  └─────┘   └──────┘  └─────┘
```

**Benefits:**
- Single entry point for frontend
- Simplified client-side code
- Backend complexity hidden from frontend
- Optimized data fetching for UI needs

### 2.2 Strangler Fig Pattern (for Platform Services)

Each platform service can evolve independently:

```
Phase 1: Use third-party API/scraper
    ↓
Phase 2: Migrate to official API (if available)
    ↓
Phase 3: Optimize with custom caching/processing
```

### 2.3 Circuit Breaker Pattern

Prevent cascading failures when external services are down:

```typescript
class CircuitBreaker {
  private failureCount = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  async call(fn: () => Promise<any>) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onFailure() {
    this.failureCount++;
    if (this.failureCount >= 5) {
      this.state = 'OPEN';
      setTimeout(() => this.state = 'HALF_OPEN', 60000);
    }
  }
  
  private onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }
}
```

### 2.4 Cache-Aside Pattern

```typescript
async function getProduct(id: string): Promise<Product> {
  // 1. Check cache
  const cached = await redis.get(`product:${id}`);
  if (cached) return JSON.parse(cached);
  
  // 2. Fetch from service
  const product = await fetchFromService(id);
  
  // 3. Update cache
  await redis.setex(`product:${id}`, 3600, JSON.stringify(product));
  
  return product;
}
```

---

## 3. Component Specifications

### 3.1 Next.js Frontend

**Directory Structure:**
```
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx              # Dashboard home
│   ├── search/
│   │   └── page.tsx          # Search interface
│   ├── products/
│   │   └── [id]/
│   │       └── page.tsx      # Product detail
│   ├── proposals/
│   │   ├── page.tsx          # Proposals list
│   │   ├── [id]/
│   │   │   ├── page.tsx      # Proposal detail
│   │   │   └── print/
│   │   │       └── page.tsx  # Print-optimized view
│   │   └── new/
│   │       └── page.tsx      # Create proposal
│   └── trends/
│       └── page.tsx          # Trend analysis
├── api/
│   ├── search/
│   │   └── route.ts          # Search orchestrator
│   ├── products/
│   │   └── [id]/
│   │       └── route.ts      # Product detail
│   ├── proposals/
│   │   ├── route.ts          # CRUD operations
│   │   └── [id]/
│   │       ├── route.ts
│   │       └── products/
│   │           └── route.ts
│   ├── trends/
│   │   └── route.ts
│   └── export/
│       ├── csv/
│       │   └── route.ts
│       ├── json/
│       │   └── route.ts
│       └── pdf/
│           └── route.ts
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   ├── PlatformSelector.tsx
│   │   ├── FilterPanel.tsx
│   │   └── ResultsGrid.tsx
│   ├── products/
│   │   ├── ProductCard.tsx
│   │   ├── ProductDetail.tsx
│   │   └── PriceDisplay.tsx
│   ├── proposals/
│   │   ├── ProposalBuilder.tsx
│   │   ├── ProductList.tsx
│   │   └── ExportMenu.tsx
│   └── trends/
│       ├── TrendChart.tsx
│       └── TrendBadge.tsx
├── lib/
│   ├── api-client.ts         # HTTP client for backend services
│   ├── cache.ts              # Redis client
│   ├── db.ts                 # PostgreSQL client
│   └── utils.ts
└── types/
    ├── product.ts
    ├── proposal.ts
    └── trend.ts
```

**Key Technologies:**
- **React Server Components**: For data fetching and SEO
- **Client Components**: For interactive UI (search, filters, charts)
- **Server Actions**: For form submissions and mutations
- **Streaming**: For progressive loading of search results

**Example Server Component:**
```typescript
// app/(dashboard)/search/page.tsx
import { SearchBar } from '@/components/search/SearchBar';
import { ResultsGrid } from '@/components/search/ResultsGrid';

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string; platforms?: string };
}) {
  const query = searchParams.q;
  const platforms = searchParams.platforms?.split(',') || [];
  
  // Server-side data fetching
  const results = query
    ? await searchProducts(query, platforms)
    : null;
  
  return (
    <div>
      <SearchBar defaultQuery={query} defaultPlatforms={platforms} />
      {results && <ResultsGrid products={results.products} />}
    </div>
  );
}
```

---

### 3.2 Python Microservices

**Base Service Template:**

```python
# services/base/main.py
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import httpx
import redis
import json
from datetime import timedelta

app = FastAPI(
    title="Platform Service",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis client
redis_client = redis.Redis(
    host=os.getenv("REDIS_HOST", "localhost"),
    port=int(os.getenv("REDIS_PORT", 6379)),
    decode_responses=True
)

# Models
class SearchRequest(BaseModel):
    query: str
    page: int = 1
    limit: int = 20
    price_min: Optional[float] = None
    price_max: Optional[float] = None
    category: Optional[str] = None

class ProductDTO(BaseModel):
    id: str
    source: str
    source_id: str
    title: str
    description_short: Optional[str]
    price: dict
    image_urls: List[str]
    url: str
    seller: dict
    attributes: dict
    fetched_at: str

class SearchResponse(BaseModel):
    products: List[ProductDTO]
    total: int
    page: int
    limit: int

# Endpoints
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "platform-service"}

@app.post("/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    # Check cache
    cache_key = f"search:{request.query}:{request.page}"
    cached = redis_client.get(cache_key)
    
    if cached:
        return SearchResponse(**json.loads(cached))
    
    # Fetch from external API
    results = await fetch_from_external_api(request)
    
    # Normalize to ProductDTO
    products = [normalize_product(item) for item in results]
    
    response = SearchResponse(
        products=products,
        total=len(products),
        page=request.page,
        limit=request.limit
    )
    
    # Cache for 1 hour
    redis_client.setex(
        cache_key,
        timedelta(hours=1),
        response.json()
    )
    
    return response

@app.get("/detail/{product_id}", response_model=ProductDTO)
async def get_detail(product_id: str):
    cache_key = f"product:{product_id}"
    cached = redis_client.get(cache_key)
    
    if cached:
        return ProductDTO(**json.loads(cached))
    
    product = await fetch_product_detail(product_id)
    normalized = normalize_product(product)
    
    redis_client.setex(
        cache_key,
        timedelta(hours=6),
        normalized.json()
    )
    
    return normalized

async def fetch_from_external_api(request: SearchRequest):
    # Platform-specific implementation
    raise NotImplementedError

async def fetch_product_detail(product_id: str):
    # Platform-specific implementation
    raise NotImplementedError

def normalize_product(raw_data: dict) -> ProductDTO:
    # Platform-specific normalization
    raise NotImplementedError
```

**Service-Specific Implementations:**

#### Taobao Service (Port 8001)
```python
# services/taobao/main.py
import os
from base.main import app, SearchRequest, ProductDTO
import httpx

ONEBOUND_API_KEY = os.getenv("ONEBOUND_API_KEY")
ONEBOUND_BASE_URL = "https://api.onebound.cn/taobao"

async def fetch_from_external_api(request: SearchRequest):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ONEBOUND_BASE_URL}/item_search",
            params={
                "key": ONEBOUND_API_KEY,
                "q": request.query,
                "page": request.page,
                "page_size": request.limit,
                "start_price": request.price_min,
                "end_price": request.price_max,
            },
            timeout=10.0
        )
        response.raise_for_status()
        return response.json().get("items", [])

def normalize_product(raw: dict) -> ProductDTO:
    return ProductDTO(
        id=f"taobao_{raw['num_iid']}",
        source="taobao",
        source_id=str(raw['num_iid']),
        title=raw['title'],
        description_short=raw.get('desc', ''),
        price={
            "current": float(raw['price']),
            "currency": "CNY",
            "original": float(raw.get('original_price', raw['price']))
        },
        image_urls=[raw['pic_url']] + raw.get('item_imgs', []),
        url=raw['detail_url'],
        seller={
            "name": raw.get('nick', 'Unknown'),
            "id": raw.get('seller_id'),
            "rating": raw.get('seller_credit_score')
        },
        attributes={
            "sales": raw.get('volume', 0),
            "location": raw.get('location', ''),
        },
        fetched_at=datetime.utcnow().isoformat()
    )
```

#### 1688 Service (Port 8002)
```python
# services/1688/main.py
import os
import hashlib
import time
from base.main import app, SearchRequest, ProductDTO
import httpx

ALIBABA_APP_KEY = os.getenv("ALIBABA_APP_KEY")
ALIBABA_APP_SECRET = os.getenv("ALIBABA_APP_SECRET")
ALIBABA_API_URL = "https://gw.open.1688.com/openapi"

def sign_request(params: dict) -> str:
    """Generate signature for 1688 API request"""
    sorted_params = sorted(params.items())
    sign_string = ALIBABA_APP_SECRET + ''.join([f"{k}{v}" for k, v in sorted_params]) + ALIBABA_APP_SECRET
    return hashlib.md5(sign_string.encode()).hexdigest().upper()

async def fetch_from_external_api(request: SearchRequest):
    params = {
        "app_key": ALIBABA_APP_KEY,
        "method": "com.alibaba.product.search",
        "timestamp": str(int(time.time() * 1000)),
        "v": "1",
        "keywords": request.query,
        "pageNo": request.page,
        "pageSize": request.limit,
    }
    
    if request.price_min:
        params["beginAmount"] = request.price_min
    if request.price_max:
        params["endAmount"] = request.price_max
    
    params["sign"] = sign_request(params)
    
    async with httpx.AsyncClient() as client:
        response = await client.get(ALIBABA_API_URL, params=params, timeout=10.0)
        response.raise_for_status()
        return response.json().get("result", {}).get("products", [])

def normalize_product(raw: dict) -> ProductDTO:
    return ProductDTO(
        id=f"1688_{raw['productId']}",
        source="1688",
        source_id=str(raw['productId']),
        title=raw['subject'],
        description_short=raw.get('description', ''),
        price={
            "current": float(raw['price']),
            "currency": "CNY",
            "tiers": [
                {"min_quantity": tier['startQuantity'], "price": float(tier['price'])}
                for tier in raw.get('priceRanges', [])
            ]
        },
        image_urls=raw.get('imageList', []),
        url=raw['productUrl'],
        seller={
            "name": raw.get('companyName', 'Unknown'),
            "id": raw.get('memberId'),
            "verification_status": raw.get('trustLevel')
        },
        attributes={
            "moq": raw.get('moq', 1),
            "unit": raw.get('unit', 'piece'),
            "category": raw.get('categoryName', ''),
        },
        fetched_at=datetime.utcnow().isoformat()
    )
```

#### Temu Service (Port 8003)
```python
# services/temu/main.py
import os
from base.main import app, SearchRequest, ProductDTO
import httpx

SCRAPELESS_API_KEY = os.getenv("SCRAPELESS_API_KEY")
SCRAPELESS_URL = "https://api.scrapeless.com/api/v1/scraper/request"

async def fetch_from_external_api(request: SearchRequest):
    payload = {
        "actor": "temu.search",
        "input": {
            "keyword": request.query,
            "page": request.page,
            "pageSize": request.limit,
            "minPrice": request.price_min,
            "maxPrice": request.price_max,
        }
    }
    
    headers = {
        "Authorization": f"Bearer {SCRAPELESS_API_KEY}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            SCRAPELESS_URL,
            json=payload,
            headers=headers,
            timeout=30.0
        )
        response.raise_for_status()
        return response.json().get("data", {}).get("products", [])

def normalize_product(raw: dict) -> ProductDTO:
    return ProductDTO(
        id=f"temu_{raw['goodsId']}",
        source="temu",
        source_id=str(raw['goodsId']),
        title=raw['title'],
        description_short=raw.get('description', ''),
        price={
            "current": float(raw['price']['amount']) / 100,  # Temu uses cents
            "currency": raw['price']['currency'],
            "original": float(raw.get('originalPrice', {}).get('amount', 0)) / 100
        },
        image_urls=[raw['image']] + raw.get('gallery', []),
        url=f"https://www.temu.com/goods.html?goods_id={raw['goodsId']}",
        seller={
            "name": raw.get('storeName', 'Temu'),
            "rating": raw.get('storeRating')
        },
        attributes={
            "sales": raw.get('sales', 0),
            "rating": raw.get('rating', 0),
            "reviews": raw.get('reviewCount', 0),
        },
        fetched_at=datetime.utcnow().isoformat()
    )
```

#### Amazon Service (Port 8004)
```python
# services/amazon/main.py
import os
from base.main import app, SearchRequest, ProductDTO
from paapi5_python_sdk.api.default_api import DefaultApi
from paapi5_python_sdk.search_items_request import SearchItemsRequest
from paapi5_python_sdk.search_items_resource import SearchItemsResource
from paapi5_python_sdk.partner_type import PartnerType

ACCESS_KEY = os.getenv("AMAZON_ACCESS_KEY")
SECRET_KEY = os.getenv("AMAZON_SECRET_KEY")
PARTNER_TAG = os.getenv("AMAZON_PARTNER_TAG")
HOST = "webservices.amazon.com"
REGION = "us-east-1"

async def fetch_from_external_api(request: SearchRequest):
    api = DefaultApi(
        access_key=ACCESS_KEY,
        secret_key=SECRET_KEY,
        host=HOST,
        region=REGION
    )
    
    search_request = SearchItemsRequest(
        partner_tag=PARTNER_TAG,
        partner_type=PartnerType.ASSOCIATES,
        keywords=request.query,
        item_page=request.page,
        item_count=min(request.limit, 10),  # PA-API max is 10
        resources=[
            SearchItemsResource.ITEMINFO_TITLE,
            SearchItemsResource.OFFERS_LISTINGS_PRICE,
            SearchItemsResource.IMAGES_PRIMARY_LARGE,
        ]
    )
    
    response = api.search_items(search_request)
    
    if response.search_result:
        return [item for item in response.search_result.items]
    return []

def normalize_product(raw) -> ProductDTO:
    price_info = raw.offers.listings[0].price if raw.offers else None
    
    return ProductDTO(
        id=f"amazon_{raw.asin}",
        source="amazon",
        source_id=raw.asin,
        title=raw.item_info.title.display_value,
        description_short=raw.item_info.title.display_value,
        price={
            "current": float(price_info.amount) if price_info else 0,
            "currency": price_info.currency if price_info else "USD",
        },
        image_urls=[raw.images.primary.large.url] if raw.images else [],
        url=raw.detail_page_url,
        seller={
            "name": "Amazon",
        },
        attributes={
            "brand": raw.item_info.by_line_info.brand.display_value if raw.item_info.by_line_info else None,
        },
        fetched_at=datetime.utcnow().isoformat()
    )
```

#### Trends Service (Port 8005)
```python
# services/trends/main.py
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from pytrends.request import TrendReq
import numpy as np
from datetime import datetime

app = FastAPI(title="Trends Service")

class TrendRequest(BaseModel):
    keyword: str
    region: str = "worldwide"
    timeframe: str = "today 12-m"
    category: int = 0

class TimeSeriesPoint(BaseModel):
    date: str
    value: int

class TrendMetrics(BaseModel):
    slope: float
    momentum: float
    volatility: float

class TrendResponse(BaseModel):
    keyword: str
    region: str
    timeframe: str
    timeseries: List[TimeSeriesPoint]
    classification: str
    metrics: TrendMetrics
    summary: str
    related_queries: List[dict]

@app.post("/trend", response_model=TrendResponse)
async def get_trend(request: TrendRequest):
    pytrends = TrendReq(hl='en-US', tz=360)
    
    # Build payload
    pytrends.build_payload(
        [request.keyword],
        cat=request.category,
        timeframe=request.timeframe,
        geo='' if request.region == 'worldwide' else request.region
    )
    
    # Get interest over time
    interest_df = pytrends.interest_over_time()
    
    if interest_df.empty:
        raise HTTPException(status_code=404, detail="No trend data found")
    
    # Extract time series
    timeseries = [
        TimeSeriesPoint(date=str(date), value=int(value))
        for date, value in interest_df[request.keyword].items()
    ]
    
    # Calculate metrics
    values = interest_df[request.keyword].values
    slope = np.polyfit(range(len(values)), values, 1)[0]
    recent_avg = np.mean(values[-4:])  # Last 4 data points
    historical_avg = np.mean(values[:-4])
    momentum = (recent_avg - historical_avg) / historical_avg if historical_avg > 0 else 0
    volatility = np.std(values)
    
    # Classify trend
    if slope > 1 and momentum > 0.1:
        classification = "Rising"
    elif slope < -1 and momentum < -0.1:
        classification = "Declining"
    elif volatility > 20:
        classification = "Seasonal"
    else:
        classification = "Stable"
    
    # Generate summary
    summary = f"Interest in '{request.keyword}' is {classification.lower()}. "
    if classification == "Rising":
        summary += f"Search volume has increased by {momentum*100:.1f}% recently."
    elif classification == "Declining":
        summary += f"Search volume has decreased by {abs(momentum)*100:.1f}% recently."
    
    # Get related queries
    related = pytrends.related_queries()
    related_list = []
    if request.keyword in related and related[request.keyword]['top'] is not None:
        related_list = related[request.keyword]['top'].to_dict('records')[:5]
    
    return TrendResponse(
        keyword=request.keyword,
        region=request.region,
        timeframe=request.timeframe,
        timeseries=timeseries,
        classification=classification,
        metrics=TrendMetrics(
            slope=float(slope),
            momentum=float(momentum),
            volatility=float(volatility)
        ),
        summary=summary,
        related_queries=related_list
    )
```

---

## 4. Data Flow

### 4.1 Search Flow Sequence Diagram

```
User → Next.js UI → Next.js API → Platform Services → External APIs
                         ↓
                    Redis Cache
                         ↓
                    PostgreSQL (search history)
```

**Detailed Flow:**

1. User enters search query in UI
2. Client sends request to `/api/search`
3. Next.js API route:
   - Validates input
   - Checks Redis cache for recent identical search
   - If cache miss, dispatches parallel requests to platform services
   - Waits for all responses (with timeout)
   - Aggregates and normalizes results
   - Stores search in PostgreSQL
   - Caches results in Redis (TTL: 1 hour)
   - Returns unified response to client
4. UI renders results

### 4.2 Proposal Export Flow

```
User → UI → /api/export/pdf → Puppeteer → HTML Page → PDF Buffer → Download
```

**Detailed Flow:**

1. User clicks "Export PDF" on proposal page
2. Client sends request to `/api/export/pdf?proposalId=xxx`
3. API route:
   - Fetches proposal data from PostgreSQL
   - Launches Puppeteer headless browser
   - Navigates to `/proposals/[id]/print` page
   - Waits for page load and chart rendering
   - Generates PDF with `page.pdf()`
   - Stores PDF in S3/MinIO
   - Returns download URL or streams PDF buffer
4. Browser downloads PDF

---

## 5. API Specifications

### 5.1 Next.js API Routes

#### Search Endpoint

**`POST /api/search`**

**Request:**
```typescript
{
  query: string;
  platforms: ('taobao' | '1688' | 'temu' | 'amazon')[];
  filters?: {
    price_min?: number;
    price_max?: number;
    category?: string;
    moq_max?: number;
  };
  page?: number;
  limit?: number;
}
```

**Response:**
```typescript
{
  products: ProductDTO[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
  };
  metadata: {
    searchTime: number;
    platformsQueried: string[];
    platformErrors?: Record<string, string>;
  };
}
```

**Implementation:**
```typescript
// app/api/search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const validated = searchSchema.parse(body);
    
    // Check cache
    const cacheKey = `search:${JSON.stringify(validated)}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return NextResponse.json(JSON.parse(cached));
    }
    
    // Parallel service calls
    const serviceUrls = {
      taobao: 'http://taobao-service:8001/search',
      '1688': 'http://1688-service:8002/search',
      temu: 'http://temu-service:8003/search',
      amazon: 'http://amazon-service:8004/search',
    };
    
    const promises = validated.platforms.map(async (platform) => {
      try {
        const response = await fetch(serviceUrls[platform], {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: validated.query,
            page: validated.page,
            limit: validated.limit,
            ...validated.filters,
          }),
          signal: AbortSignal.timeout(5000),
        });
        
        if (!response.ok) throw new Error(`${platform} service error`);
        
        const data = await response.json();
        return { platform, products: data.products, error: null };
      } catch (error) {
        return { platform, products: [], error: error.message };
      }
    });
    
    const results = await Promise.all(promises);
    
    // Aggregate results
    const allProducts = results.flatMap(r => r.products);
    const errors = results
      .filter(r => r.error)
      .reduce((acc, r) => ({ ...acc, [r.platform]: r.error }), {});
    
    const response = {
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
    
    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(response));
    
    // Log search
    await db.query(
      'INSERT INTO searches (query, platforms, filters, result_count) VALUES ($1, $2, $3, $4)',
      [validated.query, validated.platforms, validated.filters, allProducts.length]
    );
    
    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

---

## 6. Database Schema

### 6.1 PostgreSQL Schema

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (for future auth)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Proposals table
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  currency VARCHAR(3) DEFAULT 'USD',
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'draft',
  
  CONSTRAINT valid_currency CHECK (currency IN ('USD', 'CNY', 'EUR', 'GBP'))
);

-- Proposal products (many-to-many with embedded product data)
CREATE TABLE proposal_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  product_data JSONB NOT NULL,
  notes TEXT,
  target_price DECIMAL(10, 2),
  quantity INTEGER DEFAULT 1,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  
  CONSTRAINT positive_quantity CHECK (quantity > 0)
);

-- Create index on JSONB for faster queries
CREATE INDEX idx_proposal_products_source ON proposal_products ((product_data->>'source'));
CREATE INDEX idx_proposal_products_source_id ON proposal_products ((product_data->>'source_id'));

-- Searches table (for history and analytics)
CREATE TABLE searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  query VARCHAR(500) NOT NULL,
  platforms TEXT[],
  filters JSONB,
  result_count INTEGER,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_searches_user_id ON searches(user_id);
CREATE INDEX idx_searches_created_at ON searches(created_at DESC);

-- Exports table (track generated files)
CREATE TABLE exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  format VARCHAR(10) NOT NULL,
  file_url TEXT,
  file_size INTEGER,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  
  CONSTRAINT valid_format CHECK (format IN ('pdf', 'ppt', 'csv', 'json'))
);

CREATE INDEX idx_exports_proposal_id ON exports(proposal_id);
CREATE INDEX idx_exports_expires_at ON exports(expires_at);

-- Trends cache table (optional, can use Redis only)
CREATE TABLE trend_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword VARCHAR(255) NOT NULL,
  region VARCHAR(50) NOT NULL,
  timeframe VARCHAR(50) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  
  UNIQUE(keyword, region, timeframe)
);

CREATE INDEX idx_trend_cache_expires_at ON trend_cache(expires_at);
```

### 6.2 Redis Cache Structure

```
# Search results cache
search:{query_hash} → JSON (TTL: 1 hour)

# Product detail cache
product:{source}:{source_id} → JSON (TTL: 6 hours)

# Trend data cache
trend:{keyword}:{region}:{timeframe} → JSON (TTL: 24 hours)

# Session data
session:{session_id} → JSON (TTL: 7 days)

# Rate limiting
ratelimit:{user_id}:{endpoint} → counter (TTL: 1 minute)
```

---

## 7. Deployment Architecture

### 7.1 Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Next.js application
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/sourcing
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=development
    depends_on:
      - postgres
      - redis
      - taobao-service
      - 1688-service
      - temu-service
      - amazon-service
      - trend-service
    volumes:
      - .:/app
      - /app/node_modules
  
  # Python microservices
  taobao-service:
    build:
      context: ./services/taobao
      dockerfile: Dockerfile
    ports:
      - "8001:8000"
    environment:
      - REDIS_HOST=redis
      - ONEBOUND_API_KEY=${ONEBOUND_API_KEY}
    depends_on:
      - redis
  
  1688-service:
    build:
      context: ./services/1688
      dockerfile: Dockerfile
    ports:
      - "8002:8000"
    environment:
      - REDIS_HOST=redis
      - ALIBABA_APP_KEY=${ALIBABA_APP_KEY}
      - ALIBABA_APP_SECRET=${ALIBABA_APP_SECRET}
    depends_on:
      - redis
  
  temu-service:
    build:
      context: ./services/temu
      dockerfile: Dockerfile
    ports:
      - "8003:8000"
    environment:
      - REDIS_HOST=redis
      - SCRAPELESS_API_KEY=${SCRAPELESS_API_KEY}
    depends_on:
      - redis
  
  amazon-service:
    build:
      context: ./services/amazon
      dockerfile: Dockerfile
    ports:
      - "8004:8000"
    environment:
      - REDIS_HOST=redis
      - AMAZON_ACCESS_KEY=${AMAZON_ACCESS_KEY}
      - AMAZON_SECRET_KEY=${AMAZON_SECRET_KEY}
      - AMAZON_PARTNER_TAG=${AMAZON_PARTNER_TAG}
    depends_on:
      - redis
  
  trend-service:
    build:
      context: ./services/trends
      dockerfile: Dockerfile
    ports:
      - "8005:8000"
    environment:
      - REDIS_HOST=redis
    depends_on:
      - redis
  
  # PostgreSQL database
  postgres:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=sourcing
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql
  
  # Redis cache
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### 7.2 Kubernetes (Production)

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nextjs-app
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nextjs
  template:
    metadata:
      labels:
        app: nextjs
    spec:
      containers:
      - name: nextjs
        image: sourcing-assistant/nextjs:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: url
        - name: REDIS_URL
          value: redis://redis-service:6379
        resources:
          requests:
            memory: "512Mi"
            cpu: "500m"
          limits:
            memory: "1Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: nextjs-service
spec:
  selector:
    app: nextjs
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## 8. Security Architecture

### 8.1 API Key Management

```typescript
// lib/secrets.ts
import { SecretsManager } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManager({ region: 'us-east-1' });

export async function getSecret(secretName: string): Promise<string> {
  const response = await client.getSecretValue({ SecretId: secretName });
  return response.SecretString || '';
}

// Usage
const ONEBOUND_API_KEY = await getSecret('onebound-api-key');
```

### 8.2 Rate Limiting

```typescript
// middleware/rate-limit.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export async function rateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 60
): Promise<boolean> {
  const key = `ratelimit:${identifier}`;
  const current = await redis.incr(key);
  
  if (current === 1) {
    await redis.expire(key, window);
  }
  
  return current <= limit;
}
```

---

## 9. Performance Optimization

### 9.1 Caching Strategy

| Data Type | Cache Location | TTL | Invalidation |
|-----------|---------------|-----|--------------|
| Search results | Redis | 1 hour | Manual or TTL |
| Product details | Redis | 6 hours | Manual or TTL |
| Trend data | Redis | 24 hours | Manual or TTL |
| Static assets | CDN | 1 year | Version hash |
| API responses | Browser | 5 minutes | Cache-Control header |

### 9.2 Database Optimization

```sql
-- Indexes for common queries
CREATE INDEX idx_proposals_created_by ON proposals(created_by);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposal_products_proposal_id ON proposal_products(proposal_id);

-- Partial index for active proposals
CREATE INDEX idx_active_proposals ON proposals(created_at DESC) 
WHERE status != 'archived';

-- JSONB GIN index for product attributes
CREATE INDEX idx_product_attributes ON proposal_products USING GIN (product_data);
```

---

## 10. Monitoring & Observability

### 10.1 Metrics to Track

**Application Metrics:**
- Request rate (requests/second)
- Response time (p50, p95, p99)
- Error rate (%)
- Cache hit rate (%)

**Business Metrics:**
- Searches per day
- Proposals created per day
- Average products per proposal
- Export format distribution

**Infrastructure Metrics:**
- CPU usage
- Memory usage
- Database connections
- Redis memory usage

### 10.2 Logging Structure

```typescript
// lib/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  format: winston.format.json(),
  defaultMeta: { service: 'sourcing-assistant' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Usage
logger.info('Search completed', {
  query: 'wireless earbuds',
  platforms: ['taobao', 'amazon'],
  resultCount: 45,
  responseTime: 2340,
});
```

---

**Document End**
