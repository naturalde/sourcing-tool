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

- **[PRD.md](./PRD.md)** - Complete Product Requirements Document
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical Architecture Documentation

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
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS v4, shadcn/ui, Framer Motion
- **Backend**: Python 3.11+ FastAPI microservice
- **Database**: PostgreSQL (optional), Redis (optional)
- **APIs**: OneBound Taobao API, ScrapingBee (fallback)

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

Edit `.env` and add your OneBound API credentials:
```env
ONEBOUND_API_KEY=your_api_key_here
ONEBOUND_API_SECRET=your_api_secret_here
```

Get your API credentials from [OneBound](https://open.onebound.cn/)

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
│   ├── db.ts               # PostgreSQL client (optional)
│   └── redis.ts            # Redis client (optional)
├── types/                   # TypeScript type definitions
│   └── product.ts          # Product DTOs
├── services/                # Python microservices
│   └── taobao/             # Taobao OneBound integration
│       ├── main.py         # FastAPI service
│       └── requirements.txt
├── public/logos/           # Platform logos
├── schema.sql              # Database schema
├── PRD.md                  # Product Requirements Document
└── .env                    # Environment variables
```

## 🔌 API Endpoints

### Frontend API Routes
- `POST /api/search` - Search products from Taobao
  - Body: `{ query, platforms, page, limit }`
  - Returns: `{ products, pagination, metadata }`

### Proposals (Database required)
- `GET /api/proposals` - List proposals
- `POST /api/proposals` - Create proposal
- `GET /api/proposals/:id` - Get proposal details
- `PUT /api/proposals/:id` - Update proposal
- `DELETE /api/proposals/:id` - Delete proposal

### Taobao Service
- `http://localhost:8001/docs` - Interactive API documentation
- `POST /search` - Search Taobao products
- `GET /health` - Health check endpoint

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:
- `proposals` - Sourcing proposals
- `proposal_products` - Products in proposals (JSONB)
- `searches` - Search history
- `exports` - Export records

See [schema.sql](./schema.sql) for complete schema.

## � Platform Integration

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
- Optional database and Redis (graceful degradation)

## 📈 Performance

- Optional Redis caching for API responses
- 60-second timeout for web scraping requests
- Optimized image loading with Next.js Image
- Efficient React Server Components

## ✨ Current Features

### Completed ✅
- Beautiful light-mode enterprise UI
- Pill-shaped animated navigation
- Taobao product search via OneBound API
- Real-time debug window for API inspection
- Product table with multi-select checkboxes
- City/location display for products
- Platform badges and icons
- Responsive design
- Error handling and graceful degradation

### In Progress 🚧
- Proposal management system
- Database integration (PostgreSQL)
- Export functionality (PDF, Excel)

### Planned 📋
- Additional platforms (1688, Temu, Amazon)
- Advanced filtering and sorting
- Price comparison charts
- User authentication
- Client portal

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
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
