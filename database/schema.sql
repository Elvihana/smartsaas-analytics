-- ============================================================
-- SmartSaaS Analytics - Complete Database Schema
-- Target: Supabase PostgreSQL
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "timescaledb";

-- ============================================================
-- 1. CUSTOMERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    industry VARCHAR(100),
    country VARCHAR(100),
    company_size INTEGER,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'suspended')),
    website VARCHAR(255),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_industry ON customers(industry);
CREATE INDEX idx_customers_country ON customers(country);
CREATE INDEX idx_customers_email ON customers(email);

-- ============================================================
-- 2. SUBSCRIPTIONS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    plan_name VARCHAR(100) NOT NULL,
    plan_tier VARCHAR(50) DEFAULT 'standard' CHECK (plan_tier IN ('starter', 'standard', 'professional', 'enterprise')),
    monthly_price DECIMAL(10, 2) NOT NULL,
    billing_cycle VARCHAR(50) DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'quarterly', 'yearly')),
    start_date DATE NOT NULL,
    renewal_date DATE,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'canceled', 'expired')),
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_customer_id ON subscriptions(customer_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_plan_name ON subscriptions(plan_name);

-- ============================================================
-- 3. SUPPORT TICKETS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'on_hold')),
    priority VARCHAR(50) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    category VARCHAR(100) CHECK (category IN ('technical', 'billing', 'feature_request', 'account', 'other')),
    assigned_to VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX idx_tickets_customer_id ON support_tickets(customer_id);
CREATE INDEX idx_tickets_status ON support_tickets(status);
CREATE INDEX idx_tickets_priority ON support_tickets(priority);

-- ============================================================
-- 4. PREDICTION HISTORY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS prediction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    company_size INTEGER,
    login_frequency FLOAT,
    days_since_last_activity INTEGER,
    support_ticket_count INTEGER,
    subscription_length INTEGER,
    risk_percentage DECIMAL(5, 2),
    prediction VARCHAR(50),
    recommendation TEXT,
    shap_values JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_predictions_customer_id ON prediction_history(customer_id);
CREATE INDEX idx_predictions_created_at ON prediction_history(created_at);
CREATE INDEX idx_predictions_risk_percentage ON prediction_history(risk_percentage);

-- ============================================================
-- 5. CAMPAIGNS TABLE (Retention Campaigns)
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(100) CHECK (campaign_type IN ('email', 'discount', 'feature_promotion', 'engagement', 'win_back')),
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed')),
    target_segment VARCHAR(255),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    budget DECIMAL(10, 2),
    spent DECIMAL(10, 2) DEFAULT 0,
    created_by VARCHAR(255),
    metrics JSONB DEFAULT '{"sent": 0, "opened": 0, "clicked": 0, "converted": 0}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);

-- ============================================================
-- 6. ACTIVITY LOG TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    activity_type VARCHAR(100),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_activity_customer_id ON activity_log(customer_id);
CREATE INDEX idx_activity_created_at ON activity_log(created_at);

-- ============================================================
-- 7. LOGIN ACTIVITY TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS login_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    login_time TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR(50),
    user_agent TEXT,
    device_type VARCHAR(50)
);

CREATE INDEX idx_login_customer_id ON login_activity(customer_id);
CREATE INDEX idx_login_time ON login_activity(login_time);

-- ============================================================
-- 8. REVENUE TABLE (Monthly aggregation)
-- ============================================================
CREATE TABLE IF NOT EXISTS monthly_revenue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month DATE NOT NULL,
    total_revenue DECIMAL(12, 2),
    active_subscriptions INTEGER,
    new_subscriptions INTEGER,
    canceled_subscriptions INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_revenue_month ON monthly_revenue(month);

-- ============================================================
-- 9. CHURN METRICS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS churn_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month DATE NOT NULL,
    total_customers INTEGER,
    active_customers INTEGER,
    churned_customers INTEGER,
    churn_rate DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_churn_month ON churn_metrics(month);

-- ============================================================
-- VIEWS (Optional - for common queries)
-- ============================================================

-- Active Customers Summary
CREATE OR REPLACE VIEW v_active_customers_summary AS
SELECT 
    COUNT(DISTINCT c.id) as total_active,
    COUNT(DISTINCT s.id) as active_subscriptions,
    COALESCE(SUM(s.monthly_price), 0) as total_monthly_revenue
FROM customers c
LEFT JOIN subscriptions s ON c.id = s.customer_id AND s.status = 'active'
WHERE c.status = 'active';

-- Revenue by Industry
CREATE OR REPLACE VIEW v_revenue_by_industry AS
SELECT 
    c.industry,
    COUNT(DISTINCT c.id) as customer_count,
    COUNT(DISTINCT s.id) as subscription_count,
    COALESCE(SUM(s.monthly_price), 0) as total_revenue
FROM customers c
LEFT JOIN subscriptions s ON c.id = s.customer_id AND s.status = 'active'
WHERE c.industry IS NOT NULL
GROUP BY c.industry
ORDER BY total_revenue DESC;

-- Revenue by Plan
CREATE OR REPLACE VIEW v_revenue_by_plan AS
SELECT 
    s.plan_name,
    COUNT(DISTINCT s.id) as subscription_count,
    COALESCE(SUM(s.monthly_price), 0) as total_revenue
FROM subscriptions s
WHERE s.status = 'active'
GROUP BY s.plan_name
ORDER BY total_revenue DESC;

-- High Risk Customers
CREATE OR REPLACE VIEW v_high_risk_customers AS
SELECT 
    c.id,
    c.company_name,
    c.email,
    MAX(ph.risk_percentage) as latest_risk,
    MAX(ph.created_at) as last_prediction
FROM customers c
LEFT JOIN prediction_history ph ON c.id = ph.customer_id
WHERE c.status = 'active'
GROUP BY c.id, c.company_name, c.email
HAVING MAX(ph.risk_percentage) > 50
ORDER BY latest_risk DESC;

-- Customer Support Summary
CREATE OR REPLACE VIEW v_customer_support_summary AS
SELECT 
    c.id,
    c.company_name,
    COUNT(DISTINCT st.id) as total_tickets,
    SUM(CASE WHEN st.status IN ('open', 'in_progress') THEN 1 ELSE 0 END) as open_tickets,
    SUM(CASE WHEN st.priority = 'urgent' THEN 1 ELSE 0 END) as urgent_tickets
FROM customers c
LEFT JOIN support_tickets st ON c.id = st.customer_id
WHERE c.status = 'active'
GROUP BY c.id, c.company_name
ORDER BY total_tickets DESC;

-- ============================================================
-- TRIGGERS (Optional - for audit trails)
-- ============================================================

-- Update updated_at timestamp on customers
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_customers_updated_at
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_customers_updated_at();

-- Update updated_at timestamp on subscriptions
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_subscriptions_updated_at
BEFORE UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_subscriptions_updated_at();

-- ============================================================
-- PERMISSIONS (for Supabase RLS if needed)
-- ============================================================

-- Enable RLS (Row Level Security) on tables
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prediction_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Note: Define specific policies based on your authentication system
-- Example policy (uncomment and customize):
/*
CREATE POLICY "Enable read access for authenticated users" ON customers
    FOR SELECT USING (TRUE);

CREATE POLICY "Enable insert for authenticated users" ON customers
    FOR INSERT WITH CHECK (TRUE);
*/
