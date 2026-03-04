# Setup Guide

This guide will help you set up the Multi-Platform Sourcing Assistant project from scratch.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20 or higher ([Download](https://nodejs.org/))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Git** ([Download](https://git-scm.com/downloads))
- **npm** or **yarn** (comes with Node.js)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd sourcing-assistant
npm install
```

This will install all Node.js dependencies including:
- Next.js and React
- PostgreSQL client (pg)
- Redis client (ioredis)
- Zod for validation
- React Query for data fetching
- Recharts for visualizations

**Note**: The TypeScript errors about missing `pg` and `ioredis` modules will be resolved after running `npm install`.

### 2. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and configure the following:

#### Required API Keys

**Taobao Integration (OneBound API)**
```env
ONEBOUND_API_KEY=your_key_here
```
- Sign up at: https://www.onebound.cn/
- Free tier: 100 requests/day
- Used for: Taobao product search and details

**1688 Integration (Alibaba Open Platform)**
```env
ALIBABA_APP_KEY=your_app_key
ALIBABA_APP_SECRET=your_app_secret
```
- Apply at: https://open.1688.com/
- Used for: 1688 B2B product search and supplier info

**Temu Integration (Scrapeless)**
```env
SCRAPELESS_API_KEY=your_key_here
```
- Sign up at: https://www.scrapeless.com/
- Used for: Temu product scraping

**Amazon Integration (Product Advertising API)**
```env
AMAZON_ACCESS_KEY=your_access_key
AMAZON_SECRET_KEY=your_secret_key
AMAZON_PARTNER_TAG=your_partner_tag
```
- Apply at: https://affiliate-program.amazon.com/
- Used for: Amazon product search

#### Database Configuration (Default for Docker)
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/sourcing
REDIS_URL=redis://localhost:6379
```

### 3. Start the Application

#### Option A: Using Docker (Recommended)

Start all services with Docker Compose:

```bash
# Build images
npm run docker:build

# Start all services
npm run docker:up

# View logs
npm run docker:logs
```

This starts:
- **Next.js** on http://localhost:3000
- **PostgreSQL** on localhost:5432
- **Redis** on localhost:6379
- **Taobao Service** on http://localhost:8001
- **Trends Service** on http://localhost:8005

#### Option B: Local Development

If you want to run services individually:

**1. Start PostgreSQL and Redis:**
```bash
docker-compose up postgres redis -d
```

**2. Start Next.js:**
```bash
npm run dev
```

**3. Start Python services (in separate terminals):**

Taobao Service:
```bash
cd services/taobao
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Trends Service:
```bash
cd services/trends
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8005
```

### 4. Verify Installation

Once all services are running, verify:

1. **Next.js App**: http://localhost:3000
2. **Taobao Service API Docs**: http://localhost:8001/docs
3. **Trends Service API Docs**: http://localhost:8005/docs

### 5. Test the API

Test the search endpoint:

```bash
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "wireless earbuds",
    "platforms": ["taobao"],
    "page": 1,
    "limit": 10
  }'
```

Test the trends endpoint:

```bash
curl "http://localhost:3000/api/trends?keyword=wireless%20earbuds&timeframe=today%2012-m"
```

## Troubleshooting

### TypeScript Errors

If you see errors like "Cannot find module 'pg'" or "Cannot find module 'ioredis'":

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Docker Issues

**Containers won't start:**
```bash
# Stop all containers
npm run docker:down

# Remove volumes
docker-compose down -v

# Rebuild and restart
npm run docker:build
npm run docker:up
```

**Port already in use:**
```bash
# Check what's using the port
lsof -i :3000  # or :5432, :6379, etc.

# Kill the process or change the port in docker-compose.yml
```

### Database Connection Issues

**Can't connect to PostgreSQL:**
```bash
# Check if PostgreSQL is running
docker-compose ps

# View PostgreSQL logs
docker-compose logs postgres

# Connect to PostgreSQL directly
docker-compose exec postgres psql -U postgres -d sourcing
```

### Python Service Issues

**Module not found errors:**
```bash
cd services/taobao  # or services/trends
pip install -r requirements.txt --force-reinstall
```

**Redis connection errors:**
```bash
# Check if Redis is running
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping
# Should return: PONG
```

## Development Workflow

### Making Changes

1. **Frontend changes**: Edit files in `app/`, changes auto-reload
2. **API routes**: Edit files in `app/api/`, restart may be needed
3. **Python services**: Changes auto-reload with `--reload` flag
4. **Database schema**: Edit `schema.sql`, then recreate database:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Running Tests

```bash
# Lint TypeScript
npm run lint

# Type check
npx tsc --noEmit
```

### Viewing Logs

```bash
# All services
npm run docker:logs

# Specific service
docker-compose logs -f nextjs
docker-compose logs -f taobao-service
docker-compose logs -f postgres
```

### Database Management

**Access PostgreSQL:**
```bash
docker-compose exec postgres psql -U postgres -d sourcing
```

**Run SQL queries:**
```sql
-- List all tables
\dt

-- View proposals
SELECT * FROM proposals;

-- View search history
SELECT * FROM searches ORDER BY created_at DESC LIMIT 10;
```

**Backup database:**
```bash
docker-compose exec postgres pg_dump -U postgres sourcing > backup.sql
```

**Restore database:**
```bash
docker-compose exec -T postgres psql -U postgres sourcing < backup.sql
```

### Redis Management

**Access Redis CLI:**
```bash
docker-compose exec redis redis-cli
```

**Common Redis commands:**
```bash
# List all keys
KEYS *

# Get a value
GET search:wireless_earbuds:1

# Delete a key
DEL search:wireless_earbuds:1

# Clear all cache
FLUSHALL
```

## Next Steps

1. **Read the documentation**:
   - [PRD.md](./PRD.md) - Product requirements
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - Technical details

2. **Implement remaining services**:
   - 1688 service (services/1688/)
   - Temu service (services/temu/)
   - Amazon service (services/amazon/)

3. **Build the frontend**:
   - Create UI components
   - Implement search interface
   - Build proposal management pages

4. **Add export functionality**:
   - PDF generation with Puppeteer
   - PowerPoint generation with python-pptx

## API Keys Registration

### OneBound (Taobao)
1. Visit https://www.onebound.cn/
2. Register an account
3. Navigate to API section
4. Copy your API key
5. Free tier: 100 requests/day

### Alibaba Open Platform (1688)
1. Visit https://open.1688.com/
2. Create developer account
3. Create an application
4. Get App Key and App Secret
5. Apply for product search permissions

### Scrapeless (Temu)
1. Visit https://www.scrapeless.com/
2. Sign up for an account
3. Choose a plan (free tier available)
4. Copy API key from dashboard

### Amazon Product Advertising API
1. Join Amazon Associates: https://affiliate-program.amazon.com/
2. Apply for Product Advertising API access
3. Create access credentials in AWS IAM
4. Get Access Key, Secret Key, and Partner Tag

## Support

If you encounter issues:

1. Check this setup guide
2. Review [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Check service logs: `npm run docker:logs`
4. Verify environment variables in `.env`
5. Ensure all required ports are available

## Production Deployment

For production deployment:

1. Use environment-specific `.env` files
2. Enable HTTPS
3. Set up proper authentication
4. Configure monitoring (Sentry, DataDog)
5. Set up CI/CD pipeline
6. Use managed databases (AWS RDS, etc.)
7. Deploy to Kubernetes or cloud platform

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed deployment architecture.
