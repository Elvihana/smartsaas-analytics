-- ============================================================
-- SmartSaaS Analytics - Common Queries
-- Untuk reports, analytics, dan troubleshooting
-- ============================================================

-- ============================================================
-- DASHBOARD STATISTICS
-- ============================================================

-- Query 1: Dashboard Overview Stats
SELECT 
    (SELECT COUNT(*) FROM customers WHERE status = 'active') as total_active_customers,
    (SELECT COUNT(*) FROM customers WHERE status != 'active') as inactive_customers,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
    (SELECT COUNT(*) FROM subscriptions WHERE status = 'canceled') as canceled_subscriptions,
    (SELECT COALESCE(SUM(monthly_price), 0) FROM subscriptions WHERE status = 'active') as total_monthly_revenue,
    (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress')) as open_support_tickets;

-- Query 2: Customer Growth (Last 12 Months)
SELECT 
    DATE_TRUNC('month', created_at)::date as month,
    COUNT(*) as new_customers
FROM customers
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month ASC;

-- Query 3: Revenue by Month (Last 12 Months)
SELECT 
    DATE_TRUNC('month', s.created_at)::date as month,
    COALESCE(SUM(s.monthly_price), 0) as monthly_revenue,
    COUNT(DISTINCT s.id) as subscription_count
FROM subscriptions s
WHERE s.status = 'active' AND s.created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', s.created_at)
ORDER BY month ASC;

-- Query 4: Churn Analysis (Last 30 Days)
SELECT 
    'Churn Rate' as metric,
    ROUND(
        (SELECT COUNT(*) FROM customers WHERE status = 'inactive' AND updated_at >= NOW() - INTERVAL '30 days')::numeric / 
        NULLIF((SELECT COUNT(*) FROM customers), 0) * 100, 
    2) as value;

-- ============================================================
-- CUSTOMER ANALYTICS
-- ============================================================

-- Query 5: Customers by Industry (Top 10)
SELECT 
    industry,
    COUNT(*) as customer_count,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count,
    ROUND(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END)::numeric / COUNT(*) * 100, 1) as active_percentage
FROM customers
GROUP BY industry
ORDER BY customer_count DESC
LIMIT 10;

-- Query 6: Customers by Country (Top 10)
SELECT 
    country,
    COUNT(*) as customer_count,
    SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_count
FROM customers
GROUP BY country
ORDER BY customer_count DESC
LIMIT 10;

-- Query 7: Customer Size Distribution
SELECT 
    CASE 
        WHEN company_size < 50 THEN 'Startup (< 50)'
        WHEN company_size < 200 THEN 'SMB (50-200)'
        WHEN company_size < 1000 THEN 'Mid-Market (200-1000)'
        ELSE 'Enterprise (>1000)'
    END as company_tier,
    COUNT(*) as customer_count,
    AVG(company_size) as avg_company_size
FROM customers
WHERE company_size IS NOT NULL
GROUP BY company_tier
ORDER BY customer_count DESC;

-- Query 8: High-Risk Customers (Risk > 50%)
SELECT 
    c.id,
    c.company_name,
    c.email,
    c.status,
    ph.risk_percentage,
    ph.created_at as last_prediction,
    s.plan_name,
    s.monthly_price
FROM customers c
LEFT JOIN prediction_history ph ON c.id = ph.customer_id
LEFT JOIN subscriptions s ON c.id = s.customer_id AND s.status = 'active'
WHERE EXISTS (
    SELECT 1 FROM prediction_history 
    WHERE customer_id = c.id 
    AND risk_percentage > 50 
    AND created_at = (SELECT MAX(created_at) FROM prediction_history WHERE customer_id = c.id)
)
ORDER BY ph.risk_percentage DESC;

-- Query 9: Customers with Support Issues
SELECT 
    c.id,
    c.company_name,
    c.email,
    COUNT(DISTINCT st.id) as total_tickets,
    SUM(CASE WHEN st.status IN ('open', 'in_progress') THEN 1 ELSE 0 END) as open_tickets,
    SUM(CASE WHEN st.priority = 'urgent' THEN 1 ELSE 0 END) as urgent_tickets
FROM customers c
LEFT JOIN support_tickets st ON c.id = st.customer_id
WHERE c.status = 'active'
GROUP BY c.id, c.company_name, c.email
HAVING COUNT(DISTINCT st.id) > 0
ORDER BY total_tickets DESC;

-- ============================================================
-- SUBSCRIPTION & REVENUE ANALYTICS
-- ============================================================

-- Query 10: Revenue by Plan (Current)
SELECT 
    plan_name,
    plan_tier,
    COUNT(*) as subscription_count,
    SUM(monthly_price) as total_monthly_revenue,
    AVG(monthly_price) as avg_price_per_plan
FROM subscriptions
WHERE status = 'active'
GROUP BY plan_name, plan_tier
ORDER BY total_monthly_revenue DESC;

-- Query 11: Subscription Status Summary
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM subscriptions) * 100, 1) as percentage
FROM subscriptions
GROUP BY status
ORDER BY count DESC;

-- Query 12: Customer Lifetime Value (CLV) - Top 20
SELECT 
    c.id,
    c.company_name,
    c.industry,
    c.status,
    COUNT(DISTINCT s.id) as subscription_count,
    SUM(s.monthly_price) as current_monthly_value,
    SUM(s.monthly_price) * 12 as estimated_annual_value,
    MIN(s.start_date) as first_subscription,
    MAX(s.renewal_date) as latest_renewal
FROM customers c
LEFT JOIN subscriptions s ON c.id = s.customer_id AND s.status = 'active'
GROUP BY c.id, c.company_name, c.industry, c.status
ORDER BY estimated_annual_value DESC
LIMIT 20;

-- Query 13: Subscription Renewals (Next 30 Days)
SELECT 
    c.company_name,
    c.email,
    s.plan_name,
    s.monthly_price,
    s.renewal_date,
    EXTRACT(DAY FROM s.renewal_date - NOW()) as days_until_renewal
FROM subscriptions s
JOIN customers c ON s.customer_id = c.id
WHERE s.status = 'active'
AND s.renewal_date BETWEEN NOW() AND NOW() + INTERVAL '30 days'
ORDER BY s.renewal_date ASC;

-- ============================================================
-- PREDICTION & CHURN ANALYTICS
-- ============================================================

-- Query 14: Prediction Summary (Latest by Customer)
SELECT 
    c.company_name,
    c.email,
    ph.risk_percentage,
    ph.prediction,
    ph.created_at,
    LAG(ph.risk_percentage) OVER (PARTITION BY c.id ORDER BY ph.created_at) as previous_risk
FROM prediction_history ph
JOIN customers c ON ph.customer_id = c.id
WHERE ph.created_at = (
    SELECT MAX(created_at) FROM prediction_history WHERE customer_id = ph.customer_id
)
ORDER BY ph.risk_percentage DESC;

-- Query 15: Churn Risk Distribution
SELECT 
    CASE 
        WHEN risk_percentage < 30 THEN 'Low (< 30%)'
        WHEN risk_percentage < 60 THEN 'Medium (30-60%)'
        ELSE 'High (> 60%)'
    END as risk_level,
    COUNT(*) as customer_count,
    ROUND(AVG(risk_percentage), 1) as avg_risk
FROM prediction_history ph
WHERE ph.created_at = (
    SELECT MAX(created_at) FROM prediction_history WHERE customer_id = ph.customer_id
)
GROUP BY risk_level
ORDER BY CASE 
    WHEN risk_percentage < 30 THEN 1
    WHEN risk_percentage < 60 THEN 2
    ELSE 3 END;

-- ============================================================
-- CAMPAIGN ANALYTICS
-- ============================================================

-- Query 16: Campaign Performance (Last 90 Days)
SELECT 
    id,
    name,
    campaign_type,
    status,
    budget,
    spent,
    ROUND((spent / NULLIF(budget, 0) * 100), 1) as spend_percentage,
    (metrics->>'sent')::INT as sent,
    (metrics->>'opened')::INT as opened,
    (metrics->>'clicked')::INT as clicked,
    (metrics->>'converted')::INT as converted,
    ROUND(((metrics->>'opened')::INT::numeric / NULLIF((metrics->>'sent')::INT, 0) * 100), 1) as open_rate,
    ROUND(((metrics->>'clicked')::INT::numeric / NULLIF((metrics->>'opened')::INT, 0) * 100), 1) as click_rate
FROM campaigns
WHERE created_at >= NOW() - INTERVAL '90 days'
ORDER BY created_at DESC;

-- ============================================================
-- SUPPORT & ACTIVITY ANALYTICS
-- ============================================================

-- Query 17: Support Ticket Summary
SELECT 
    CASE 
        WHEN priority = 'urgent' THEN '1_URGENT'
        WHEN priority = 'high' THEN '2_HIGH'
        WHEN priority = 'medium' THEN '3_MEDIUM'
        ELSE '4_LOW' 
    END as priority_level,
    COUNT(*) as ticket_count,
    SUM(CASE WHEN status IN ('open', 'in_progress') THEN 1 ELSE 0 END) as open_count,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) as resolved_count
FROM support_tickets
GROUP BY priority_level
ORDER BY priority_level;

-- Query 18: Most Active Customers (Last 30 Days)
SELECT 
    c.id,
    c.company_name,
    c.email,
    COUNT(*) as activity_count,
    MAX(al.created_at) as last_activity
FROM activity_log al
JOIN customers c ON al.customer_id = c.id
WHERE al.created_at >= NOW() - INTERVAL '30 days'
GROUP BY c.id, c.company_name, c.email
ORDER BY activity_count DESC
LIMIT 20;

-- Query 19: Inactive Customers (No Activity > 30 Days)
SELECT 
    c.id,
    c.company_name,
    c.email,
    c.status,
    c.updated_at,
    EXTRACT(DAY FROM NOW() - c.updated_at) as days_inactive,
    s.plan_name,
    s.monthly_price
FROM customers c
LEFT JOIN subscriptions s ON c.id = s.customer_id AND s.status = 'active'
WHERE c.status = 'active'
AND NOT EXISTS (
    SELECT 1 FROM activity_log 
    WHERE customer_id = c.id 
    AND created_at >= NOW() - INTERVAL '30 days'
)
ORDER BY c.updated_at ASC;

-- ============================================================
-- TROUBLESHOOTING & DATA QUALITY
-- ============================================================

-- Query 20: Data Quality Check
SELECT 
    'Customers' as table_name,
    COUNT(*) as total_rows,
    COUNT(DISTINCT id) as unique_ids,
    COUNT(CASE WHEN email IS NULL THEN 1 END) as missing_email,
    COUNT(CASE WHEN status IS NULL THEN 1 END) as missing_status,
    COUNT(DISTINCT industry) as unique_industries
FROM customers
UNION ALL
SELECT 
    'Subscriptions',
    COUNT(*),
    COUNT(DISTINCT id),
    COUNT(CASE WHEN plan_name IS NULL THEN 1 END),
    COUNT(CASE WHEN status IS NULL THEN 1 END),
    COUNT(DISTINCT plan_name)
FROM subscriptions
UNION ALL
SELECT 
    'Support Tickets',
    COUNT(*),
    COUNT(DISTINCT id),
    COUNT(CASE WHEN description IS NULL THEN 1 END),
    COUNT(CASE WHEN status IS NULL THEN 1 END),
    COUNT(DISTINCT priority)
FROM support_tickets
UNION ALL
SELECT 
    'Prediction History',
    COUNT(*),
    COUNT(DISTINCT id),
    COUNT(CASE WHEN prediction IS NULL THEN 1 END),
    COUNT(CASE WHEN risk_percentage IS NULL THEN 1 END),
    0
FROM prediction_history;

-- Query 21: Missing Customer Relationships
SELECT 
    'Subscriptions missing customer' as issue,
    COUNT(*) as count
FROM subscriptions
WHERE customer_id NOT IN (SELECT id FROM customers)
UNION ALL
SELECT 
    'Tickets missing customer',
    COUNT(*)
FROM support_tickets
WHERE customer_id NOT IN (SELECT id FROM customers)
UNION ALL
SELECT 
    'Predictions missing customer',
    COUNT(*)
FROM prediction_history
WHERE customer_id NOT IN (SELECT id FROM customers);

-- ============================================================
-- EXPORT TEMPLATES
-- ============================================================

-- Query 22: Export Customers for Mailing List
SELECT 
    company_name,
    contact_name,
    email,
    phone,
    country,
    status
FROM customers
WHERE status = 'active'
ORDER BY company_name;

-- Query 23: Export High-Value Customers
SELECT 
    c.company_name,
    c.contact_name,
    c.email,
    c.industry,
    COUNT(DISTINCT s.id) as subscription_count,
    SUM(s.monthly_price) * 12 as annual_value
FROM customers c
LEFT JOIN subscriptions s ON c.id = s.customer_id AND s.status = 'active'
WHERE c.status = 'active'
GROUP BY c.id, c.company_name, c.contact_name, c.email, c.industry
HAVING SUM(s.monthly_price) > 500
ORDER BY annual_value DESC;

-- Query 24: Export At-Risk Customers for Campaign
SELECT 
    c.company_name,
    c.contact_name,
    c.email,
    ph.risk_percentage,
    ph.prediction,
    s.plan_name,
    s.monthly_price
FROM customers c
LEFT JOIN prediction_history ph ON c.id = ph.customer_id
LEFT JOIN subscriptions s ON c.id = s.customer_id AND s.status = 'active'
WHERE c.status = 'active'
AND ph.risk_percentage > 50
ORDER BY ph.risk_percentage DESC;
