-- ============================================================
-- SmartSaaS Analytics - Seed Data
-- Test data untuk development & testing
-- ============================================================

-- ============================================================
-- SAMPLE CUSTOMERS
-- ============================================================
INSERT INTO customers (id, company_name, contact_name, email, phone, industry, country, company_size, status, website)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001'::uuid, 'TechFlow Solutions', 'John Smith', 'john.smith@techflow.com', '+1-555-0101', 'Technology', 'USA', 150, 'active', 'https://techflow.com'),
    ('550e8400-e29b-41d4-a716-446655440002'::uuid, 'CloudBase Inc', 'Sarah Johnson', 'sarah.j@cloudbase.io', '+1-555-0102', 'Cloud Services', 'USA', 280, 'active', 'https://cloudbase.io'),
    ('550e8400-e29b-41d4-a716-446655440003'::uuid, 'DataMind Analytics', 'Michael Chen', 'michael@datamind.co', '+44-20-7946-0958', 'Data Analytics', 'UK', 85, 'active', 'https://datamind.co'),
    ('550e8400-e29b-41d4-a716-446655440004'::uuid, 'FinanceFlow Corp', 'Emma Davis', 'emma@financeflow.net', '+1-555-0104', 'Finance', 'USA', 320, 'active', 'https://financeflow.net'),
    ('550e8400-e29b-41d4-a716-446655440005'::uuid, 'MarketPulse Ltd', 'Robert Wilson', 'robert.w@marketpulse.com', '+33-1-4234-5678', 'Marketing', 'France', 95, 'active', 'https://marketpulse.com'),
    ('550e8400-e29b-41d4-a716-446655440006'::uuid, 'RetailMax Systems', 'Lisa Anderson', 'lisa@retailmax.com', '+1-555-0106', 'Retail', 'USA', 210, 'active', 'https://retailmax.com'),
    ('550e8400-e29b-41d4-a716-446655440007'::uuid, 'HealthLink Solutions', 'David Martinez', 'david.m@healthlink.org', '+1-555-0107', 'Healthcare', 'USA', 450, 'active', 'https://healthlink.org'),
    ('550e8400-e29b-41d4-a716-446655440008'::uuid, 'EduTech Innovations', 'Jessica Lee', 'jessica@edutech.io', '+65-6234-5678', 'Education', 'Singapore', 120, 'active', 'https://edutech.io'),
    ('550e8400-e29b-41d4-a716-446655440009'::uuid, 'LogiMove Logistics', 'Carlos Rodriguez', 'carlos@logimove.com', '+34-91-123-4567', 'Logistics', 'Spain', 175, 'inactive', 'https://logimove.com'),
    ('550e8400-e29b-41d4-a716-446655440010'::uuid, 'AgriGrow Farms', 'Patricia Brown', 'patricia@agrigrow.net', '+1-555-0110', 'Agriculture', 'USA', 60, 'pending', 'https://agrigrow.net');

-- ============================================================
-- SAMPLE SUBSCRIPTIONS
-- ============================================================
INSERT INTO subscriptions (id, customer_id, plan_name, plan_tier, monthly_price, billing_cycle, start_date, renewal_date, status, auto_renew)
VALUES 
    -- TechFlow Solutions - Professional plan
    ('550e8400-e29b-41d4-a716-446655450001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'Professional', 'professional', 299.99, 'monthly', '2025-06-01', '2026-07-01', 'active', true),
    
    -- CloudBase Inc - Enterprise plan
    ('550e8400-e29b-41d4-a716-446655450002'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'Enterprise', 'enterprise', 999.99, 'yearly', '2024-01-15', '2026-01-15', 'active', true),
    
    -- DataMind Analytics - Standard plan
    ('550e8400-e29b-41d4-a716-446655450003'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid, 'Standard', 'standard', 149.99, 'monthly', '2025-08-20', '2026-09-20', 'active', true),
    
    -- FinanceFlow Corp - Professional plan
    ('550e8400-e29b-41d4-a716-446655450004'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid, 'Professional', 'professional', 299.99, 'quarterly', '2025-05-10', '2026-08-10', 'active', true),
    
    -- MarketPulse Ltd - Starter plan
    ('550e8400-e29b-41d4-a716-446655450005'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid, 'Starter', 'starter', 49.99, 'monthly', '2025-09-01', '2026-10-01', 'active', true),
    
    -- RetailMax Systems - Professional plan
    ('550e8400-e29b-41d4-a716-446655450006'::uuid, '550e8400-e29b-41d4-a716-446655440006'::uuid, 'Professional', 'professional', 299.99, 'monthly', '2024-12-15', '2026-07-15', 'active', true),
    
    -- HealthLink Solutions - Enterprise plan
    ('550e8400-e29b-41d4-a716-446655450007'::uuid, '550e8400-e29b-41d4-a716-446655440007'::uuid, 'Enterprise', 'enterprise', 1499.99, 'yearly', '2025-03-01', '2026-03-01', 'active', true),
    
    -- EduTech Innovations - Standard plan
    ('550e8400-e29b-41d4-a716-446655450008'::uuid, '550e8400-e29b-41d4-a716-446655440008'::uuid, 'Standard', 'standard', 149.99, 'monthly', '2025-07-10', '2026-08-10', 'active', true),
    
    -- LogiMove Logistics - Standard plan (canceled)
    ('550e8400-e29b-41d4-a716-446655450009'::uuid, '550e8400-e29b-41d4-a716-446655440009'::uuid, 'Standard', 'standard', 149.99, 'monthly', '2025-02-01', '2025-11-01', 'canceled', false),
    
    -- AgriGrow Farms - Starter plan (paused)
    ('550e8400-e29b-41d4-a716-446655450010'::uuid, '550e8400-e29b-41d4-a716-446655440010'::uuid, 'Starter', 'starter', 49.99, 'monthly', '2025-09-15', '2026-10-15', 'paused', false);

-- ============================================================
-- SAMPLE SUPPORT TICKETS
-- ============================================================
INSERT INTO support_tickets (id, customer_id, ticket_number, title, description, status, priority, category, assigned_to, created_at, resolved_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655460001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'TICKET-001', 'API Integration Issue', 'Getting 401 errors when trying to authenticate via API', 'in_progress', 'high', 'technical', 'support@example.com', NOW() - INTERVAL '2 days', NULL),
    ('550e8400-e29b-41d4-a716-446655460002'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'TICKET-002', 'Billing Inquiry', 'Questions about invoice from last month', 'resolved', 'medium', 'billing', 'support@example.com', NOW() - INTERVAL '5 days', NOW() - INTERVAL '1 day'),
    ('550e8400-e29b-41d4-a716-446655460003'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid, 'TICKET-003', 'Export Data Feature Request', 'Need ability to export reports in Excel format', 'open', 'low', 'feature_request', NULL, NOW() - INTERVAL '3 days', NULL),
    ('550e8400-e29b-41d4-a716-446655460004'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid, 'TICKET-004', 'Dashboard Performance Slow', 'Dashboard takes too long to load with large datasets', 'in_progress', 'urgent', 'technical', 'support@example.com', NOW() - INTERVAL '1 day', NULL),
    ('550e8400-e29b-41d4-a716-446655460005'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid, 'TICKET-005', 'Account Access Problem', 'Cannot login to account - password reset not working', 'open', 'urgent', 'account', NULL, NOW() - INTERVAL '4 hours', NULL);

-- ============================================================
-- SAMPLE CAMPAIGNS
-- ============================================================
INSERT INTO campaigns (id, name, description, campaign_type, status, target_segment, start_date, end_date, budget, spent, created_by, metrics)
VALUES 
    ('550e8400-e29b-41d4-a716-446655470001'::uuid, 'Summer Retention Campaign', 'Special offer for at-risk customers', 'email', 'active', 'high_risk', NOW(), NOW() + INTERVAL '30 days', 5000.00, 1250.00, 'admin@example.com', '{"sent": 250, "opened": 120, "clicked": 45, "converted": 12}'::jsonb),
    ('550e8400-e29b-41d4-a716-446655470002'::uuid, 'Upsell to Enterprise', 'Target Standard plan customers for upgrade', 'feature_promotion', 'scheduled', 'standard_tier', NOW() + INTERVAL '7 days', NOW() + INTERVAL '37 days', 3000.00, 0.00, 'admin@example.com', '{"sent": 0, "opened": 0, "clicked": 0, "converted": 0}'::jsonb),
    ('550e8400-e29b-41d4-a716-446655470003'::uuid, 'Win-back Campaign', 'Re-engage inactive customers', 'discount', 'completed', 'inactive', NOW() - INTERVAL '30 days', NOW() - INTERVAL '5 days', 4000.00, 4000.00, 'admin@example.com', '{"sent": 150, "opened": 75, "clicked": 30, "converted": 8}'::jsonb);

-- ============================================================
-- SAMPLE PREDICTION HISTORY
-- ============================================================
INSERT INTO prediction_history (id, customer_id, company_size, login_frequency, days_since_last_activity, support_ticket_count, subscription_length, risk_percentage, prediction, recommendation)
VALUES 
    ('550e8400-e29b-41d4-a716-446655480001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 150, 25, 2, 1, 720, 15.34, 'Tidak Churn', 'Pelanggan stabil. Terus maintain kualitas layanan.'),
    ('550e8400-e29b-41d4-a716-446655480002'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 280, 30, 1, 0, 180, 8.12, 'Tidak Churn', 'Pelanggan sangat engaged. Excellent retention.'),
    ('550e8400-e29b-41d4-a716-446655480003'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid, 85, 8, 14, 3, 120, 42.67, 'Tidak Churn', 'Moderate risk. Pertimbangkan program engagement.'),
    ('550e8400-e29b-41d4-a716-446655480004'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid, 320, 5, 28, 5, 90, 68.45, 'Churn', 'RISIKO TINGGI. Immediate action required.'),
    ('550e8400-e29b-41d4-a716-446655480005'::uuid, '550e8400-e29b-41d4-a716-446655440005'::uuid, 95, 2, 45, 8, 30, 82.91, 'Churn', 'RISIKO SANGAT TINGGI. Urgent intervention needed.');

-- ============================================================
-- SAMPLE ACTIVITY LOG
-- ============================================================
INSERT INTO activity_log (id, customer_id, activity_type, description, created_at)
VALUES 
    ('550e8400-e29b-41d4-a716-446655490001'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'login', 'User logged in', NOW() - INTERVAL '1 hour'),
    ('550e8400-e29b-41d4-a716-446655490002'::uuid, '550e8400-e29b-41d4-a716-446655440001'::uuid, 'export', 'User exported report', NOW() - INTERVAL '2 hours'),
    ('550e8400-e29b-41d4-a716-446655490003'::uuid, '550e8400-e29b-41d4-a716-446655440002'::uuid, 'login', 'User logged in', NOW() - INTERVAL '30 minutes'),
    ('550e8400-e29b-41d4-a716-446655490004'::uuid, '550e8400-e29b-41d4-a716-446655440003'::uuid, 'view_report', 'User viewed analytics report', NOW() - INTERVAL '3 hours'),
    ('550e8400-e29b-41d4-a716-446655490005'::uuid, '550e8400-e29b-41d4-a716-446655440004'::uuid, 'support_ticket', 'Support ticket created', NOW() - INTERVAL '1 day');

-- ============================================================
-- SUMMARY
-- ============================================================
-- Total Customers: 10 (8 active, 1 inactive, 1 pending)
-- Total Active Subscriptions: 9
-- Total Revenue (Monthly): $4,598.93
-- Prediction History: 5 predictions (1 high risk, 1 very high risk)
-- Support Tickets: 5 open/pending tickets
-- Campaigns: 3 campaigns (1 active, 1 scheduled, 1 completed)
