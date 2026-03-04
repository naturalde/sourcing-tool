CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

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

CREATE INDEX idx_proposal_products_proposal_id ON proposal_products(proposal_id);
CREATE INDEX idx_proposal_products_source ON proposal_products ((product_data->>'source'));
CREATE INDEX idx_proposal_products_source_id ON proposal_products ((product_data->>'source_id'));

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
CREATE INDEX idx_proposals_created_by ON proposals(created_by);
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_active_proposals ON proposals(created_at DESC) WHERE status != 'archived';
CREATE INDEX idx_product_attributes ON proposal_products USING GIN (product_data);
