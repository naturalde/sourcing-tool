# Multi-Platform Sourcing Assistant

A modern sourcing assistant web application that enables sourcing agents to search and analyze products from Taobao through a beautiful, intuitive dashboard.

## 🎯 Features

- **Taobao Product Search**: Search Taobao products via OneBound API
- **Beautiful UI**: Modern light-mode enterprise design with pill-shaped navigation
- **Product Selection**: Multi-select products with checkboxes
- **Debug Window**: Real-time API request/response debugging
- **Proposal Management**: Create and manage sourcing proposals
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
- `POST /api/search` - Search products from Taobao
  - Body: `{ query, platforms, page, limit }`
  - Returns: `{ products, pagination, metadata }`

### AI Enrichment
- `POST /api/ai-enrich` - Generate alternative product designs with Gemini AI
  - Body: `{ imageUrl, userNotes }`
  - Returns: `{ original_product, design_alternatives }`

### Export
- `POST /api/export/pdf` - Export proposal as PDF
- `POST /api/export/pptx` - Export proposal as PowerPoint

### Taobao Service
- `http://localhost:8001/docs` - Interactive API documentation
- `POST /search` - Search Taobao products
- `GET /health` - Health check endpoint

## 💾 Data Storage

The application uses **browser localStorage** for all data persistence:
- Proposals and products are stored client-side
- No database setup required
- Data persists across browser sessions

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

- 60-second timeout for API requests
- React 19 with compiler optimization enabled
- Efficient component rendering
- Session storage for search results caching

**⚠️ See [CODEBASE_AUDIT.md](./CODEBASE_AUDIT.md) for performance optimization recommendations**

## ✨ Features

### Completed ✅
- **Search**: Taobao product search via OneBound API
- **UI**: Modern light-mode design with responsive layout
- **Proposals**: Create and manage sourcing proposals (localStorage)
- **Export**: PDF and PowerPoint export with product images
- **AI Enrichment**: Generate alternative product designs with Gemini AI
- **Product Details**: Fetch detailed product information on demand
- **Multi-select**: Checkbox selection for adding products to proposals
- **Filtering**: Price range and MOQ filtering

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
