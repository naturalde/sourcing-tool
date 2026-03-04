# Product Requirements Document (PRD)
## Multi-Platform Sourcing Assistant

**Version:** 1.0  
**Last Updated:** March 2026  
**Document Owner:** Product Team

---

## 1. Executive Summary

### 1.1 Product Vision

A comprehensive sourcing assistant web application that enables sourcing agents to search, compare, and analyze products across multiple Chinese and global e-commerce platforms (Taobao, 1688, Temu, Amazon) through a unified dashboard. The platform provides demand trend analysis, product comparison tools, and professional proposal generation capabilities with exports in PDF, PPT, JSON, and CSV formats.

### 1.2 Business Objectives

- **Efficiency**: Reduce sourcing research time by 70% through unified multi-platform search
- **Intelligence**: Provide data-driven insights via Google Trends integration for demand forecasting
- **Professionalism**: Enable rapid creation of client-ready proposals in multiple formats
- **Scalability**: Support growing user base with microservices architecture

### 1.3 Success Metrics

- Average search response time < 3-4 seconds across all platforms
- User can create a complete sourcing proposal in < 15 minutes
- 90%+ uptime across all platform integrations
- Support for 100+ concurrent users

---

## 2. User Personas

### 2.1 Primary: Sourcing Agent (Internal User)

**Profile:**
- Professional buyer or sourcing specialist
- Manages multiple client requests simultaneously
- Needs to compare prices, MOQ, and supplier reliability across platforms
- Creates formal proposals for clients

**Goals:**
- Quickly find best-value products across multiple marketplaces
- Understand product demand trends before committing
- Generate professional, data-backed proposals
- Track and manage multiple sourcing requests

**Pain Points:**
- Manual platform switching is time-consuming
- Difficult to compare products across different marketplaces
- No centralized trend analysis
- Proposal creation is manual and repetitive

### 2.2 Secondary: Client (View-Only, Future Phase)

**Profile:**
- Business owner or procurement manager
- Receives sourcing proposals from agents
- Makes final purchasing decisions

**Goals:**
- Review curated product selections
- Understand market trends and pricing
- Access proposals in familiar formats (PDF/PPT)

---

## 3. Core User Flows

### 3.1 Multi-Platform Search Flow

```
User Input → Platform Selection → Parallel API Calls → Result Normalization → Unified Display
```

**Steps:**
1. User enters search keyword (e.g., "wireless earbuds")
2. User selects target platforms (Taobao, 1688, Temu, Amazon)
3. User applies optional filters:
   - Price range (min/max)
   - Category
   - MOQ (Minimum Order Quantity)
   - Platform-specific filters
4. System dispatches parallel requests to selected platform services
5. Each service normalizes results to internal DTO format
6. Results are merged, deduplicated, and displayed in unified grid
7. User can sort by: price, platform, sales volume, rating

**Success Criteria:**
- All selected platforms return results within 4 seconds
- Results display with consistent formatting across platforms
- Filters work correctly for all platforms

---

### 3.2 Result Exploration & Product Selection Flow

```
Search Results → Filter/Sort → Product Detail View → Add to Shortlist → Build Proposal
```

**Steps:**
1. User views combined results with platform badges
2. User applies filters:
   - Platform filter (show/hide specific platforms)
   - Price range slider
   - MOQ threshold
   - Rating minimum
3. User clicks product card to view details
4. System fetches extended product information:
   - Full description and specifications
   - Seller information and ratings
   - Pricing tiers (for B2B platforms)
   - Available variations
   - Original platform link
5. User adds product to shortlist with:
   - Optional notes
   - Target price
   - Quantity needed
6. Shortlist persists across sessions

**Success Criteria:**
- Detail view loads in < 2 seconds
- All product attributes display correctly
- Shortlist updates in real-time
- User can manage multiple shortlists

---

### 3.3 Trend Analysis Flow

```
Product/Keyword Selection → Trend API Call → Data Visualization → Insight Generation
```

**Steps:**
1. User selects product or keyword for trend analysis
2. User specifies:
   - Geographic region (default: global)
   - Time range (3 months, 6 months, 12 months, 5 years)
3. System calls Google Trends API
4. System processes trend data:
   - Calculates slope and momentum
   - Identifies seasonal patterns
   - Generates trend classification ("Rising", "Stable", "Declining")
5. UI displays:
   - Interactive line chart with time series
   - Trend badge and interpretation
   - Related queries and topics
   - Comparative trends (if multiple products selected)

**Success Criteria:**
- Trend data loads in < 3 seconds
- Chart is interactive and responsive
- Trend classification is accurate
- Related queries provide actionable insights

---

### 3.4 Proposal Creation & Export Flow

```
Shortlist → Proposal Builder → Preview → Export (PDF/PPT/CSV/JSON)
```

**Steps:**
1. User creates new proposal from shortlist
2. User fills proposal metadata:
   - Proposal name
   - Client name
   - Target currency
   - Notes and recommendations
3. User organizes products:
   - Reorder items
   - Add product-specific notes
   - Set recommended quantities
   - Include/exclude trend data
4. User previews proposal in web view
5. User exports in desired format:
   - **PDF**: Professional document with branding, product cards, trend charts
   - **PPT**: Slide deck with title slide, product slides, trend slides
   - **CSV**: Spreadsheet-compatible flat file
   - **JSON**: Machine-readable structured data
6. System generates export and provides download link
7. Proposal is saved to database for future access

**Success Criteria:**
- PDF generation completes in < 10 seconds
- PPT generation completes in < 15 seconds
- CSV/JSON export is instant
- All exports maintain data integrity
- Exports are properly formatted and professional

---

## 4. Functional Requirements

### 4.1 Module A: Search Orchestrator (Next.js BFF)

**Endpoint:** `GET /api/search`

**Inputs:**
```typescript
{
  q: string;                    // Search keyword
  platforms: Array<'taobao' | '1688' | 'temu' | 'amazon'>;
  price_min?: number;
  price_max?: number;
  category?: string;
  moq_max?: number;
  page?: number;
  limit?: number;
}
```

**Behavior:**
- Validate input parameters
- Dispatch parallel HTTP requests to selected platform services
- Implement timeout handling (max 5 seconds per platform)
- Aggregate responses from all platforms
- Normalize data to unified product DTO
- Apply cross-platform filters
- Implement pagination
- Cache results in Redis (TTL: 1 hour)

**Output:**
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

**Error Handling:**
- Partial failures: Return results from successful platforms
- Complete failure: Return 503 with retry-after header
- Log all errors for monitoring

---

### 4.2 Module B: Platform Services (Python FastAPI Microservices)

Each platform service implements a consistent interface:

#### 4.2.1 Taobao Service

**Base URL:** `http://taobao-service:8001`

**Endpoints:**

**`POST /search`**
- Integrates with OneBound Taobao API
- Endpoint: `item_search`
- Returns: Normalized product list

**`GET /detail/{product_id}`**
- Fetches full product details
- Returns: Complete product DTO with extended attributes

**Implementation Details:**
- Use OneBound API for keyword search
- Handle pagination (OneBound supports up to 100 items per request)
- Extract and normalize:
  - Title, images, price (CNY)
  - Sales volume, seller rating
  - Shipping options
  - Product variations
- Implement rate limiting (OneBound: 100 requests/day free tier)
- Cache popular searches

---

#### 4.2.2 1688 Service

**Base URL:** `http://1688-service:8002`

**Endpoints:**

**`POST /search`**
- Uses official Alibaba Open Platform
- API: `com.alibaba.product.search`
- Returns: B2B product listings with MOQ and tiered pricing

**`GET /detail/{product_id}`**
- API: `com.alibaba.product.get`
- Returns: Full product specs, supplier info, pricing tiers

**`GET /supplier/{company_id}`**
- API: `com.alibaba.company.get`
- Returns: Supplier verification status, ratings, transaction history

**Implementation Details:**
- Authenticate with App Key/Secret
- Handle OAuth 2.0 token refresh
- Parse tiered pricing structures
- Extract MOQ requirements
- Normalize supplier ratings
- Implement request signing per Alibaba specs

---

#### 4.2.3 Temu Service

**Base URL:** `http://temu-service:8003`

**Endpoints:**

**`POST /search`**
- Uses Temu Scraper API (e.g., Scrapeless, ScrapingBee)
- Returns: Product listings with pricing and availability

**`GET /detail/{product_id}`**
- Scrapes product detail page
- Returns: Extended product information

**Implementation Details:**
- Integrate with scraper API provider
- Handle anti-bot measures via provider
- Parse dynamic pricing
- Extract flash sale information
- Normalize international shipping costs
- Implement retry logic for failed scrapes
- Monitor scraper API quota

---

#### 4.2.4 Amazon Service

**Base URL:** `http://amazon-service:8004`

**Endpoints:**

**`POST /search`**
- Uses Amazon Product Advertising API v5
- Operation: `SearchItems`
- Supports: Keyword, category, price filters, sorting

**`GET /detail/{asin}`**
- Operation: `GetItems`
- Resources: Images, Features, Offers, Reviews, Variations
- Returns: Complete product information

**Implementation Details:**
- Authenticate with Access Key/Secret Key
- Sign requests per PA-API v5 specs
- Handle marketplace selection (US, UK, JP, etc.)
- Parse offer listings and variations
- Extract review ratings and count
- Implement request throttling (1 request/second)
- Cache ASIN lookups

---

### 4.3 Module C: Trends Service (Python FastAPI)

**Base URL:** `http://trend-service:8005`

**Endpoints:**

**`POST /trend`**

**Input:**
```python
{
  "keyword": str,
  "region": str = "worldwide",  # ISO country code or "worldwide"
  "timeframe": str = "today 12-m",  # e.g., "today 3-m", "today 5-y"
  "category": int = 0  # Google Trends category ID
}
```

**Behavior:**
- Call Google Trends API
- Retrieve interest over time data
- Calculate trend metrics:
  - Linear regression slope
  - Momentum (recent vs. historical average)
  - Volatility (standard deviation)
- Classify trend: "Rising", "Stable", "Declining", "Seasonal"
- Fetch related queries and topics

**Output:**
```python
{
  "keyword": str,
  "timeseries": [
    {"date": "2025-01", "value": 75},
    ...
  ],
  "classification": "Rising" | "Stable" | "Declining" | "Seasonal",
  "metrics": {
    "slope": float,
    "momentum": float,
    "volatility": float
  },
  "summary": str,  # Human-readable interpretation
  "related_queries": [
    {"query": str, "value": int},
    ...
  ]
}
```

**Implementation Details:**
- Use official Google Trends API (alpha)
- Fallback to pytrends library if needed
- Implement caching (TTL: 24 hours)
- Handle quota limits gracefully
- Support batch trend requests

---

### 4.4 Module D: Proposal & Storage (Next.js + PostgreSQL)

**Database Schema:**

**`proposals` table:**
```sql
CREATE TABLE proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255),
  currency VARCHAR(3) DEFAULT 'USD',
  notes TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(50) DEFAULT 'draft'
);
```

**`proposal_products` table:**
```sql
CREATE TABLE proposal_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES proposals(id) ON DELETE CASCADE,
  product_data JSONB NOT NULL,  -- Full ProductDTO
  notes TEXT,
  target_price DECIMAL(10, 2),
  quantity INTEGER,
  position INTEGER,  -- For ordering
  created_at TIMESTAMP DEFAULT NOW()
);
```

**`searches` table (for history):**
```sql
CREATE TABLE searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query VARCHAR(500) NOT NULL,
  platforms TEXT[],
  filters JSONB,
  result_count INTEGER,
  user_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**API Endpoints:**

**`POST /api/proposals`** - Create new proposal  
**`GET /api/proposals`** - List user's proposals  
**`GET /api/proposals/:id`** - Get proposal details  
**`PUT /api/proposals/:id`** - Update proposal  
**`DELETE /api/proposals/:id`** - Delete proposal  
**`POST /api/proposals/:id/products`** - Add product to proposal  
**`DELETE /api/proposals/:id/products/:productId`** - Remove product  
**`PUT /api/proposals/:id/products/:productId`** - Update product notes/quantity

---

### 4.5 Module E: Export & Reporting

#### 4.5.1 CSV/JSON Export

**Endpoint:** `GET /api/export/:proposalId?format=csv|json`

**CSV Format:**
```csv
Platform,Product ID,Title,Price,Currency,MOQ,Seller,URL,Notes,Target Price,Quantity
taobao,123456,Wireless Earbuds,29.99,CNY,1,TechStore,https://...,Good quality,25.00,100
```

**JSON Format:**
```json
{
  "proposal": {
    "id": "uuid",
    "name": "Q1 2026 Electronics Sourcing",
    "client": "ABC Corp",
    "created_at": "2026-03-01T10:00:00Z"
  },
  "products": [
    {
      "source": "taobao",
      "source_id": "123456",
      "title": "Wireless Earbuds",
      "price": 29.99,
      "currency": "CNY",
      ...
    }
  ]
}
```

---

#### 4.5.2 PDF Export

**Endpoint:** `GET /api/export/:proposalId/pdf`

**Implementation:**
- Next.js API route triggers Puppeteer
- Renders dedicated proposal page at `/proposals/:id/print`
- Print page includes:
  - Company branding header
  - Proposal metadata table
  - Product cards with images
  - Trend charts (if included)
  - Summary and recommendations
- Puppeteer configuration:
  ```typescript
  await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' }
  });
  ```
- Returns PDF buffer as download

**Layout:**
1. Cover page: Proposal name, client, date, agent
2. Executive summary: Key findings, recommendations
3. Product pages: 2-3 products per page with images, specs, pricing
4. Trend analysis: Charts and interpretation
5. Appendix: Detailed specifications table

---

#### 4.5.3 PPT Export

**Endpoint:** `POST /api/export/:proposalId/ppt`

**Implementation:**
- Next.js route calls Python `report-service`
- Report service endpoint: `POST /report/ppt`
- Uses `python-pptx` library
- Template structure:
  1. **Title Slide**: Proposal name, client, date, logo
  2. **Overview Slide**: Summary statistics (total products, price range, platforms)
  3. **Product Slides**: One slide per product
     - Product image (left half)
     - Title, price, MOQ, seller (right half)
     - Key specifications as bullet points
  4. **Trend Slides**: One slide per trend analysis
     - Keyword and timeframe
     - Line chart image
     - Interpretation and recommendation
  5. **Summary Slide**: Next steps and contact information

**Python Implementation:**
```python
from pptx import Presentation
from pptx.util import Inches, Pt

def generate_ppt(proposal_data: dict) -> bytes:
    prs = Presentation('templates/proposal_template.pptx')
    
    # Title slide
    title_slide = prs.slides.add_slide(prs.slide_layouts[0])
    title_slide.shapes.title.text = proposal_data['name']
    
    # Product slides
    for product in proposal_data['products']:
        slide = prs.slides.add_slide(prs.slide_layouts[5])
        # Add image, text, etc.
    
    # Save to BytesIO
    output = BytesIO()
    prs.save(output)
    return output.getvalue()
```

---

## 5. Data Models

### 5.1 Internal Product DTO (Normalized)

```typescript
interface ProductDTO {
  // Identity
  id: string;                          // Internal UUID
  source: 'taobao' | '1688' | 'temu' | 'amazon';
  source_id: string;                   // Platform-specific ID (SKU/ASIN/productId)
  
  // Basic Info
  title: string;
  description_short?: string;
  description_long?: string;
  
  // Pricing
  price: {
    current: number;
    currency: string;
    original?: number;                 // If on sale
    tiers?: Array<{                    // For B2B platforms
      min_quantity: number;
      price: number;
    }>;
  };
  
  // Media
  image_urls: string[];
  video_url?: string;
  
  // Links
  url: string;                         // Deep link to listing
  
  // Seller
  seller: {
    name: string;
    id?: string;
    rating?: number;                   // 0-5 scale
    total_sales?: number;
    verification_status?: string;      // For 1688
  };
  
  // B2B Specific
  moq?: number;                        // Minimum Order Quantity
  lead_time?: string;                  // e.g., "7-15 days"
  
  // Attributes
  attributes: Record<string, string>;  // Flexible key-value pairs
  category?: string;
  brand?: string;
  
  // Metrics
  sales_volume?: number;
  review_count?: number;
  rating?: number;
  
  // Trend (if fetched)
  trend?: TrendData;
  
  // Metadata
  fetched_at: string;                  // ISO timestamp
  availability?: 'in_stock' | 'out_of_stock' | 'pre_order';
}
```

### 5.2 Trend Data Model

```typescript
interface TrendData {
  keyword: string;
  region: string;
  timeframe: string;
  
  timeseries: Array<{
    date: string;                      // ISO date
    value: number;                     // 0-100 interest index
  }>;
  
  classification: 'Rising' | 'Stable' | 'Declining' | 'Seasonal';
  
  metrics: {
    slope: number;                     // Linear regression slope
    momentum: number;                  // Recent vs. historical average
    volatility: number;                // Standard deviation
  };
  
  summary: string;                     // Human-readable interpretation
  
  related_queries?: Array<{
    query: string;
    value: number;
  }>;
  
  fetched_at: string;
}
```

---

## 6. Non-Functional Requirements

### 6.1 Performance

- **Search Response Time**: < 4 seconds for multi-platform search (parallel calls)
- **Detail View Load Time**: < 2 seconds
- **Trend Analysis**: < 3 seconds
- **PDF Generation**: < 10 seconds for 20-product proposal
- **PPT Generation**: < 15 seconds for 20-product proposal
- **CSV/JSON Export**: < 1 second

### 6.2 Scalability

- Support 100+ concurrent users
- Handle 1000+ searches per day
- Store 10,000+ proposals
- Cache hit rate > 60% for popular searches

### 6.3 Reliability

- **Uptime**: 99.5% (excluding planned maintenance)
- **Platform Service Availability**: Graceful degradation if one platform fails
- **Data Persistence**: All proposals backed up daily
- **Error Recovery**: Automatic retry for transient failures (max 3 attempts)

### 6.4 Security

- **API Keys**: Store all external API credentials in secure vault (AWS Secrets Manager / HashiCorp Vault)
- **Authentication**: JWT-based auth for Next.js routes (future: integrate with SSO)
- **Rate Limiting**: Implement per-user rate limits to prevent abuse
- **Data Privacy**: No storage of sensitive client data without encryption
- **HTTPS**: All external API calls over HTTPS
- **Input Validation**: Sanitize all user inputs to prevent injection attacks

### 6.5 Compliance

- **Platform ToS**: Adhere to each platform's Terms of Service
  - Taobao/1688: Use official APIs where available, respect rate limits
  - Temu: Use compliant scraping services with proper user-agent and rate limiting
  - Amazon: Follow PA-API usage guidelines, display required disclaimers
  - Google Trends: Respect API quota and attribution requirements
- **Data Retention**: Implement data retention policies per platform requirements
- **Attribution**: Display platform logos and required disclaimers in exports

### 6.6 Localization

- **UI Languages**: English (primary), Simplified Chinese (secondary)
- **Currency Support**: USD, CNY, EUR, GBP (with real-time conversion)
- **Date/Time**: Display in user's timezone
- **Product Content**: Preserve original language, offer translation toggle (future)

### 6.7 Monitoring & Logging

- **Application Monitoring**: Track API response times, error rates, cache hit rates
- **Platform Health**: Monitor availability of each platform service
- **User Analytics**: Track search patterns, popular platforms, conversion to proposals
- **Error Logging**: Centralized logging with severity levels (Sentry/DataDog)
- **Alerts**: Notify team if platform service down > 5 minutes or error rate > 5%

---

## 7. Technical Architecture

### 7.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│                  Next.js 14 (App Router)                    │
│              React Server Components + Client               │
│                    Tailwind CSS + shadcn/ui                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP/REST
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Next.js API Routes                       │
│                   (BFF - Backend for Frontend)              │
│                                                             │
│  /api/search         - Search orchestrator                 │
│  /api/products/:id   - Product detail aggregator           │
│  /api/proposals      - Proposal CRUD                       │
│  /api/export/*       - Export handlers                     │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      │ HTTP/REST
                      │
        ┌─────────────┼─────────────┬─────────────┬──────────┐
        │             │             │             │          │
┌───────▼──────┐ ┌───▼────┐ ┌──────▼─────┐ ┌─────▼────┐ ┌──▼────────┐
│   Taobao     │ │  1688  │ │    Temu    │ │  Amazon  │ │  Trends   │
│   Service    │ │ Service│ │   Service  │ │  Service │ │  Service  │
│  (FastAPI)   │ │(FastAPI)│ │  (FastAPI) │ │ (FastAPI)│ │ (FastAPI) │
│   :8001      │ │ :8002  │ │   :8003    │ │  :8004   │ │  :8005    │
└───────┬──────┘ └───┬────┘ └──────┬─────┘ └─────┬────┘ └──┬────────┘
        │            │             │             │          │
        │            │             │             │          │
┌───────▼────────────▼─────────────▼─────────────▼──────────▼─────────┐
│                     External APIs / Data Sources                    │
│                                                                      │
│  OneBound API  │  Alibaba Open  │  Temu Scraper  │  Amazon PA-API  │
│  (Taobao)      │  Platform      │  (Scrapeless)  │  v5             │
│                │  (1688)        │                │                  │
│                                                                      │
│                      Google Trends API                              │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                        Data & Storage Layer                          │
│                                                                      │
│  PostgreSQL          Redis Cache         MinIO/S3                   │
│  (Proposals, Users)  (Search results)    (PDF/PPT files)            │
└──────────────────────────────────────────────────────────────────────┘
```

### 7.2 Technology Stack

**Frontend:**
- Next.js 14+ (App Router, React Server Components)
- TypeScript
- Tailwind CSS
- shadcn/ui (component library)
- Recharts (trend visualization)
- React Query / SWR (data fetching)
- Zustand (client state management)

**Backend (Next.js):**
- Next.js API Routes (BFF layer)
- Puppeteer (PDF generation)
- PostgreSQL client (pg / Prisma)
- Redis client (ioredis)

**Python Microservices:**
- FastAPI (async web framework)
- httpx (async HTTP client)
- pydantic (data validation)
- python-pptx (PowerPoint generation)
- pytrends / Google Trends API client
- Redis (caching)
- SQLAlchemy (if services need DB access)

**Data Storage:**
- PostgreSQL 15+ (primary database)
- Redis 7+ (caching, session storage)
- MinIO / AWS S3 (file storage for exports)

**Infrastructure:**
- Docker + Docker Compose (local development)
- Kubernetes (production deployment)
- Nginx (reverse proxy, load balancing)
- GitHub Actions (CI/CD)

**Monitoring:**
- Sentry (error tracking)
- DataDog / Prometheus + Grafana (metrics)
- Structured logging (Winston / Python logging)

---

## 8. Development Phases

### Phase 1: MVP (Weeks 1-6)

**Goals:**
- Basic multi-platform search (Taobao, 1688, Amazon)
- Product detail view
- Simple proposal creation
- CSV/JSON export

**Deliverables:**
- Next.js frontend with search UI
- 3 platform services (Taobao, 1688, Amazon)
- PostgreSQL schema and basic CRUD
- CSV/JSON export functionality

---

### Phase 2: Enhanced Features (Weeks 7-10)

**Goals:**
- Add Temu integration
- Implement trend analysis
- PDF export
- Advanced filtering and sorting

**Deliverables:**
- Temu service integration
- Trends service with Google Trends API
- PDF generation via Puppeteer
- Enhanced UI with filters and charts

---

### Phase 3: Professional Reporting (Weeks 11-14)

**Goals:**
- PPT export
- Proposal templates
- Branding customization
- Search history and saved searches

**Deliverables:**
- Report service with PPT generation
- Template management system
- User preferences and branding
- Search history feature

---

### Phase 4: Optimization & Scale (Weeks 15-18)

**Goals:**
- Performance optimization
- Caching strategy
- Monitoring and alerting
- Load testing

**Deliverables:**
- Redis caching implementation
- Performance benchmarks
- Monitoring dashboards
- Documentation and runbooks

---

## 9. Future Enhancements

### 9.1 Short-term (6 months)

- **Client Portal**: View-only access for clients to review proposals
- **Price Alerts**: Notify when product prices drop below threshold
- **Bulk Import**: Upload CSV of product IDs to create proposals
- **Collaboration**: Multi-user proposal editing with comments
- **Mobile App**: React Native app for on-the-go sourcing

### 9.2 Long-term (12+ months)

- **AI Recommendations**: ML-based product matching and suggestions
- **Automated Sourcing**: Scheduled searches and auto-proposal generation
- **Supplier Management**: CRM features for supplier relationships
- **Order Management**: Integration with procurement systems
- **Multi-language**: Support for 10+ languages
- **Blockchain Verification**: Product authenticity verification

---

## 10. Risks & Mitigation

### 10.1 Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Platform API changes | High | Medium | Version pinning, monitoring, fallback scrapers |
| Rate limiting | Medium | High | Caching, request queuing, multiple API keys |
| Scraper blocking (Temu) | High | Medium | Use reputable scraper services, rotate IPs |
| Performance degradation | Medium | Medium | Load testing, caching, CDN |
| Data inconsistency | Medium | Low | Schema validation, data normalization |

### 10.2 Business Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| API cost escalation | High | Medium | Budget monitoring, usage optimization |
| Platform ToS violations | High | Low | Legal review, compliant integrations |
| Competitor features | Medium | High | Rapid iteration, user feedback |
| User adoption | High | Medium | User training, intuitive UI, support |

---

## 11. Success Criteria

### 11.1 Launch Criteria

- [ ] All 4 platform integrations functional
- [ ] Search response time < 4 seconds (95th percentile)
- [ ] PDF/PPT export working for 20-product proposals
- [ ] Zero critical bugs in production
- [ ] Documentation complete (user guide, API docs)
- [ ] 10 beta users successfully create proposals

### 11.2 Post-Launch Metrics (3 months)

- **Usage**: 50+ active users, 500+ searches/week
- **Performance**: 99% uptime, < 4s average search time
- **Quality**: < 5% error rate across all platform services
- **Satisfaction**: NPS score > 40
- **Efficiency**: Users create proposals 60% faster than manual process

---

## 12. Appendices

### Appendix A: API Rate Limits

| Platform | Free Tier | Paid Tier | Notes |
|----------|-----------|-----------|-------|
| OneBound (Taobao) | 100 req/day | Custom | Consider paid plan for production |
| 1688 Open Platform | Varies | Varies | Apply for higher quota |
| Temu Scraper | 1000 req/month | Custom | Scrapeless pricing |
| Amazon PA-API | 8640 req/day | Same | 1 req/second limit |
| Google Trends API | Alpha (limited) | TBD | Use pytrends as fallback |

### Appendix B: Data Retention Policy

- **Search History**: 90 days
- **Proposals**: Indefinite (user can delete)
- **Cached Search Results**: 1 hour
- **Cached Trend Data**: 24 hours
- **Export Files**: 30 days (then moved to cold storage)

### Appendix C: Glossary

- **MOQ**: Minimum Order Quantity
- **SKU**: Stock Keeping Unit
- **ASIN**: Amazon Standard Identification Number
- **PA-API**: Product Advertising API
- **DTO**: Data Transfer Object
- **BFF**: Backend for Frontend

---

**Document End**
