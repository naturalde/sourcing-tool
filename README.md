# Multi-Platform Sourcing Assistant

A modern sourcing assistant web application that enables sourcing agents to search and analyze products from Taobao through a beautiful, intuitive dashboard.

## 🎯 Features

- **Taobao Product Search**: Text and image-based search via OneBound API
- **Image Search**: Upload images to find similar products
- **Beautiful UI**: Modern light-mode enterprise design with pill-shaped navigation
- **Dual View Modes**: Toggle between table and card views with keyboard navigation
- **Product Selection**: Multi-select products with checkboxes and keyboard shortcuts
- **Smart Filtering**: Price range, deduplication by title/image, automatic sorting
- **Proposal Management**: Create and manage sourcing proposals with auto-populated details
- **PPTX Template Management**: Upload and use custom PowerPoint templates for exports
- **Microservices Architecture**: Scalable Python FastAPI backend with Next.js frontend

## 📋 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Backend deployment guide (Railway/Render)
- **[CODEBASE_AUDIT.md](./CODEBASE_AUDIT.md)** - Code quality audit and improvement recommendations

## 🏗️ Architecture

```
Next.js Frontend (React Server Components)
           ↓
Next.js API Routes (BFF Layer)
           ↓
Python FastAPI Microservice (Taobao)
           ↓
OneBound API (Taobao Integration)
```

**Tech Stack:**
- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion
- **Storage**: Browser localStorage (no database required)
- **Backend**: Python 3.11+ FastAPI microservice (Taobao service)
- **Cache**: Redis (backend only, optional)
- **APIs**: OneBound (Taobao), Gemini AI (product enrichment)

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.11+
- npm or yarn

### 1. Clone and Install

```bash
cd sourcing-assistant
npm install
```

### 2. Environment Setup

Copy the example environment file and configure your API keys:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
TAOBAO_SERVICE_URL=http://localhost:8001
ONEBOUND_API_KEY=your_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API credentials:
- OneBound: [https://open.onebound.cn/](https://open.onebound.cn/)
- Gemini: [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

### 3. Start the Taobao Service

```bash
cd services/taobao
pip3 install -r requirements.txt
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

### 4. Start the Next.js Frontend

In a new terminal:

```bash
npm run dev
```

### 5. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Services:**
- Frontend: `http://localhost:3000`
- Taobao API: `http://localhost:8001`
- API Docs: `http://localhost:8001/docs`

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Development Workflow

1. **Frontend Development:**
   - Run `npm run dev` for hot reload
   - Access at `http://localhost:3000`
   - Debug window shows API requests/responses

2. **Backend Development:**
   - Taobao service auto-reloads with `--reload` flag
   - Check logs in terminal for debugging
   - API docs at `http://localhost:8001/docs`

3. **Adding Components:**
   - Use shadcn/ui: `npx shadcn@latest add <component>`
   - Components are in `components/ui/`

## 📁 Project Structure

```
sourcing-assistant/
├── app/                      # Next.js app directory
│   ├── api/                  # API routes (BFF layer)
│   │   ├── search/          # Product search endpoint
│   │   └── proposals/       # Proposal CRUD endpoints
│   ├── proposals/           # Proposals page
│   ├── page.tsx             # Main search page
│   └── layout.tsx           # Root layout
├── components/              # React components
│   ├── layout/             # Layout components (Navbar)
│   ├── products/           # Product table, cards
│   ├── search/             # Search bar, platform selector
│   └── ui/                 # shadcn/ui components
├── lib/                     # Shared utilities
│   ├── utils.ts            # Utility functions
│   ├── api-client.ts       # API client wrapper
│   └── export.ts           # Export utilities (PDF/PPTX/CSV/JSON)
├── types/                   # TypeScript type definitions
│   └── product.ts          # Product DTOs
├── services/                # Python microservices
│   └── taobao/             # Taobao OneBound integration
│       ├── main.py         # FastAPI service
│       └── requirements.txt
├── public/logos/           # Platform logos
├── DEPLOYMENT.md           # Deployment guide
├── CODEBASE_AUDIT.md       # Code quality audit
└── .env                    # Environment variables
```

## 🔌 API Endpoints

### Frontend API Routes

#### Search
- `POST /api/search` - Search products from Taobao
  - Body: `{ query, platforms, page, limit }`
  - Returns: `{ products, pagination, metadata }`
  - Timeout: 60 seconds

- `POST /api/search-image` - Search by image upload
  - Body: FormData with image file
  - Returns: `{ products, pagination, metadata }`

#### Product Details
- `GET /api/product-details` - Fetch detailed product information
  - Query: `?productId={id}&platform={platform}`
  - Returns: `ProductDetails` object with images, specs, seller info
  - **Retry Logic**: Automatically retries up to 3 times with exponential backoff
  - **Caching**: Results cached in localStorage per proposal

#### AI Enrichment
- `POST /api/ai-enrich` - Generate alternative product designs with Gemini AI
  - Body: `{ imageUrl, userNotes }`
  - Returns: `{ original_product, design_alternatives }`

#### Export
- `POST /api/export/pdf` - Export proposal as PDF
  - Body: `{ proposal, orientation }`
  - Returns: PDF file download

- `POST /api/export/pptx` - Export proposal as PowerPoint
  - Body: `{ proposal, templateId? }`
  - Returns: PPTX file download
  - **Fresh Data**: Fetches latest product details from API (not cached)
  - **Retry Logic**: Retries failed product detail fetches
  - **Custom Templates**: Supports user-uploaded PPTX templates (stored in localStorage)
  - **Template Selection**: Choose from default or custom templates during export

### Taobao Service (Backend)
- `http://localhost:8001/docs` - Interactive API documentation
- `POST /search` - Search Taobao products
- `GET /product/{product_id}` - Get detailed product information
- `GET /detail/{product_id}` - Get product DTO
- `GET /health` - Health check endpoint

## 🔄 API Call Logic & Caching Strategy

### Product Detail Fetching

The application implements a sophisticated multi-level caching strategy to minimize API calls while ensuring data freshness:

#### 1. **Automatic Fetching on Proposal Load**
When opening a proposal, all product details are automatically fetched in parallel:
```typescript
// Triggered on proposal page load
fetchAllProductDetails()
  - Checks cache first (3 levels)
  - Fetches missing details in parallel
  - Updates localStorage cache
```

#### 2. **Three-Level Cache Hierarchy**

**Level 1: In-Memory Cache (Session)**
- Stored in React state: `Map<productId, ProductDetails>`
- Fastest access, cleared on page reload
- Used during active session

**Level 2: localStorage Cache (Persistent)**
- Key: `proposal_details_{proposalId}`
- Persists across browser sessions
- Loaded on proposal open
- Updated after successful fetches

**Level 3: Product Embedded Cache**
- `product.cachedDetails` from when product was added
- Fallback for products with embedded details

#### 3. **Retry Logic with Exponential Backoff**

All product detail API calls implement automatic retry:
```typescript
fetchProductDetailsWithRetry(productId, platform, maxRetries = 3)
  - Attempt 1: Immediate
  - Attempt 2: Wait 1 second
  - Attempt 3: Wait 2 seconds
  - Logs all retry attempts
  - Returns null if all attempts fail
```

**Benefits:**
- Handles transient network errors
- Reduces failed requests due to temporary issues
- Provides detailed logging for debugging

#### 4. **Parallel Fetching**

Multiple product details are fetched simultaneously:
```typescript
Promise.all(products.map(p => fetchProductDetailsWithRetry(...)))
```

**Advantages:**
- Faster overall load time
- Efficient API usage
- Non-blocking UI

#### 5. **Smart Cache Invalidation**

- Cache persists indefinitely in localStorage
- Fresh data fetched for PPTX exports
- Manual refresh available by clearing localStorage

### Data Flow Diagram

```
User Opens Proposal
        ↓
Load from localStorage (Level 2)
        ↓
Check In-Memory Cache (Level 1)
        ↓
Check Product.cachedDetails (Level 3)
        ↓
Missing Details? → Fetch with Retry
        ↓
Update All Cache Levels
        ↓
Display Complete Data
```

### Export Fresh Data Strategy

PPTX exports always fetch fresh data:
```typescript
// For each product in proposal
const freshDetails = await fetchProductDetails(product.source_id, product.source)
// Use fresh data for:
// - Additional images (item_imgs)
// - Latest descriptions
// - Current pricing
```

This ensures exported presentations reflect the most current product information.

### PPTX Template Management

Users can upload and manage custom PowerPoint templates for exports:

#### Template Storage
- **Location**: Browser localStorage with key `pptx_templates`
- **Format**: Base64-encoded PPTX files
- **Metadata**: Template ID, name, upload date

#### Template Manager Features
```typescript
// Template interface
interface PPTXTemplate {
  id: string;
  name: string;
  file: string;        // Base64-encoded PPTX
  uploadedAt: string;
}
```

**Operations:**
- **Upload**: Select `.pptx` file, converts to base64, stores in localStorage
- **List**: Display all available templates (default + custom)
- **Delete**: Remove custom templates from localStorage
- **Select**: Choose template during PPTX export

**Usage:**
1. Navigate to proposal detail page
2. Click export dropdown → "Manage Templates"
3. Upload custom PPTX template
4. Select template when exporting
5. System uses custom template structure (future: placeholder replacement)

**Current Implementation:**
- Templates stored but default generation used
- Placeholder for future custom template parsing
- Template selection UI fully functional

### Image Search

Upload images to find visually similar products:

#### How It Works
```typescript
POST /api/search-image
- Uploads image to OneBound API
- Receives image_id
- Searches using image_id
- Returns similar products
```

**Features:**
- **Drag & Drop**: Drag images directly into search bar
- **File Upload**: Click camera icon to select image
- **Format Support**: JPG, PNG, WebP, and other common formats
- **Visual Feedback**: Image preview before search
- **Same Results**: Returns products in same format as text search

**Search Flow:**
1. User uploads image via search bar
2. Image converted to base64
3. Uploaded to OneBound `/item_search_img_upload`
4. Receives `image_id`
5. Searches with `/item_search_img` using image_id
6. Returns visually similar products

### Keyboard Navigation (Card View)

Card view supports full keyboard navigation:

**Controls:**
- **Arrow Keys** (↑↓←→): Navigate between product cards
- **Spacebar**: Toggle selection checkbox
- **Enter**: Add focused product to proposal
- **Tab**: Standard focus navigation

**Features:**
- **Visual Focus**: Focused card highlighted with sky-blue ring
- **Auto-scroll**: Keeps focused card in viewport
- **Smooth Transitions**: Animated focus changes
- **Mixed Input**: Works seamlessly with mouse/touch

**Implementation:**
- Focus state tracked via `focusedIndex`
- Refs for each card enable scrolling
- Global keyboard event listener
- Focus indicator: `ring-2 ring-sky-400 shadow-lg`

## 💾 Data Storage

The application uses **browser localStorage** for all data persistence:

**Stored Data:**
- **Proposals**: `proposals` key - All proposal metadata and products
- **Product Details Cache**: `proposal_details_{proposalId}` - Cached product details per proposal
- **PPTX Templates**: `pptx_templates` - User-uploaded custom templates (base64)
- **Search Results**: `sessionStorage` - Temporary search results cache

**Benefits:**
- No database setup required
- Data persists across browser sessions
- Client-side privacy (data never leaves browser)
- Fast access with no network latency

**Storage Limits:**
- localStorage: ~5-10MB per domain (browser-dependent)
- sessionStorage: Same limits, cleared on tab close

## 🌐 Platform Integration

### Taobao ✅
- **API**: OneBound Taobao API
- **Authentication**: API Key + Secret
- **Features**: 
  - Product search with pagination
  - Real product images and prices
  - Seller information and location
  - Sales volume data
  - Direct links to Taobao listings
- **Rate Limit**: Check OneBound pricing
- **Response Time**: ~3-7 seconds per search

### Future Platforms 🚧
- **1688**: Alibaba Open Platform (B2B sourcing)
- **Temu**: Web scraping via ScrapingBee
- **Amazon**: Product Advertising API v5

## 🔐 Security

- API keys stored in environment variables (`.env`)
- Input validation with Zod schemas
- CORS configured for microservices
- Client-side data storage (localStorage)

**⚠️ See [CODEBASE_AUDIT.md](./CODEBASE_AUDIT.md) for security improvements needed**

## 📈 Performance

- **60-second timeout** for API requests
- **React 19** with compiler optimization enabled
- **Efficient component rendering** with proper memoization
- **Session storage** for search results caching
- **Multi-level caching** for product details (in-memory + localStorage)
- **Parallel API calls** for fetching multiple product details
- **Automatic retry logic** with exponential backoff (up to 3 attempts)
- **Smart cache invalidation** to balance freshness and performance

**⚠️ See [CODEBASE_AUDIT.md](./CODEBASE_AUDIT.md) for performance optimization recommendations**

## ✨ Features

### Completed ✅
- **Search**: Taobao product search via OneBound API
- **UI**: Modern light-mode design with responsive layout
- **Proposals**: Create and manage sourcing proposals (localStorage)
- **Export**: PDF and PowerPoint export with product images (fresh data)
- **AI Enrichment**: Generate alternative product designs with Gemini AI
- **Product Details**: Automatic fetching with retry logic and multi-level caching
- **Multi-select**: Checkbox selection for adding products to proposals
- **Filtering**: Price range, deduplication (by title/image), and sorting
- **View Modes**: Table and card view with keyboard navigation
- **Retry Logic**: Automatic retry (up to 3 attempts) for failed API calls
- **Caching**: Three-level cache (in-memory, localStorage, embedded) for optimal performance

### Planned 📋
- Additional platforms (1688, Temu, Amazon)
- Testing framework (Jest + Playwright)
- Enhanced security (rate limiting, input validation)
- Component refactoring (split large files)
- Performance optimization (React.memo, code splitting)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📝 License

This project is proprietary and confidential.

## 🆘 Troubleshooting

### Common Issues

**OneBound API Error:**
- Verify API key and secret in `.env`
- Check OneBound account status
- Review service logs for detailed errors

**Service Not Starting:**
```bash
# Check if port is in use
lsof -i :8001
lsof -i :3000

# Restart services
cd services/taobao
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**No Products Showing:**
- Check debug window for API response
- Verify OneBound API credentials
- Check service logs for parsing errors

### Debug Tools
- **Debug Window**: Shows real-time API requests/responses in the UI
- **Service Logs**: Terminal output from Taobao service
- **API Docs**: `http://localhost:8001/docs` for interactive testing

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [OneBound API](https://open.onebound.cn/)
- [Gemini AI](https://ai.google.dev/)
- [Deployment Guide](./DEPLOYMENT.md)
- [Code Quality Audit](./CODEBASE_AUDIT.md)
- [Docker Documentation](https://docs.docker.com/)
