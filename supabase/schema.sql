-- ==============================================================================
-- TidyBiz — Supabase PostgreSQL Database Schema & Seed Data
-- ==============================================================================
-- Version: 1.0 (Production Supabase Schema)
-- Engine: PostgreSQL 15+ / Supabase managed PostgreSQL
-- Run this script in the Supabase SQL Editor to initialize all tables, RLS, and seed data.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS public.businesses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(120) NOT NULL,
    category VARCHAR(120),
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. EMPLOYEES TABLE
CREATE TABLE IF NOT EXISTS public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name VARCHAR(120) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'EMPLOYEE',
    department VARCHAR(80),
    email VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT ck_employees_role CHECK (role IN ('OWNER', 'MANAGER', 'EMPLOYEE')),
    CONSTRAINT uq_employees_business_name UNIQUE (business_id, name)
);

CREATE INDEX IF NOT EXISTS ix_employees_business_id ON public.employees (business_id);
CREATE INDEX IF NOT EXISTS ix_employees_email ON public.employees (email);

-- 4. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    assignee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    title VARCHAR(160) NOT NULL,
    description TEXT,
    priority VARCHAR(16) NOT NULL DEFAULT 'MEDIUM',
    status VARCHAR(16) NOT NULL DEFAULT 'TODO',
    due_at TIMESTAMPTZ NOT NULL,
    category VARCHAR(80),
    seed_key VARCHAR(80) UNIQUE,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT ck_tasks_priority CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    CONSTRAINT ck_tasks_status CHECK (status IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED'))
);

CREATE INDEX IF NOT EXISTS ix_tasks_business_id ON public.tasks (business_id);
CREATE INDEX IF NOT EXISTS ix_tasks_assignee_id ON public.tasks (assignee_id);
CREATE INDEX IF NOT EXISTS ix_tasks_status ON public.tasks (status);
CREATE INDEX IF NOT EXISTS ix_tasks_due_at ON public.tasks (due_at);
CREATE INDEX IF NOT EXISTS ix_tasks_workflow_lookup ON public.tasks (business_id, assignee_id, status, due_at);

-- 5. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;
CREATE TRIGGER set_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow public read access to single demo workspace
DROP POLICY IF EXISTS "Public read businesses" ON public.businesses;
CREATE POLICY "Public read businesses" ON public.businesses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read employees" ON public.employees;
CREATE POLICY "Public read employees" ON public.employees FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public read tasks" ON public.tasks;
CREATE POLICY "Public read tasks" ON public.tasks FOR SELECT USING (true);

-- Allow authenticated users & anon demo client to insert/update tasks and employees
DROP POLICY IF EXISTS "Enable write access for tasks" ON public.tasks;
CREATE POLICY "Enable write access for tasks" ON public.tasks FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable write access for employees" ON public.employees;
CREATE POLICY "Enable write access for employees" ON public.employees FOR ALL USING (true) WITH CHECK (true);

-- 7. SEED DATA (PrintWorks Studio workspace)
DO $$
DECLARE
    biz_id UUID;
    asha_id UUID;
    riya_id UUID;
    arjun_id UUID;
    neha_id UUID;
    now_ts TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- Ensure Business
    SELECT id INTO biz_id FROM public.businesses WHERE name = 'PrintWorks Studio' LIMIT 1;
    IF biz_id IS NULL THEN
        INSERT INTO public.businesses (name, category, timezone)
        VALUES ('PrintWorks Studio', 'Printing and design', 'Asia/Kolkata')
        RETURNING id INTO biz_id;
    END IF;

    -- Ensure Employees
    INSERT INTO public.employees (business_id, name, role, department, email)
    VALUES (biz_id, 'Asha Sharma', 'OWNER', 'Management', 'asha@printworks.studio')
    ON CONFLICT (business_id, name) DO UPDATE SET role = EXCLUDED.role, department = EXCLUDED.department, email = EXCLUDED.email
    RETURNING id INTO asha_id;

    INSERT INTO public.employees (business_id, name, role, department, email)
    VALUES (biz_id, 'Riya Patel', 'MANAGER', 'Design', 'riya.design@printworks.studio')
    ON CONFLICT (business_id, name) DO UPDATE SET role = EXCLUDED.role, department = EXCLUDED.department, email = EXCLUDED.email
    RETURNING id INTO riya_id;

    INSERT INTO public.employees (business_id, name, role, department, email)
    VALUES (biz_id, 'Arjun Mehta', 'EMPLOYEE', 'Printing and dispatch', 'arjun.ops@printworks.studio')
    ON CONFLICT (business_id, name) DO UPDATE SET role = EXCLUDED.role, department = EXCLUDED.department, email = EXCLUDED.email
    RETURNING id INTO arjun_id;

    INSERT INTO public.employees (business_id, name, role, department, email)
    VALUES (biz_id, 'Neha Roy', 'EMPLOYEE', 'Inventory and operations', 'neha.care@printworks.studio')
    ON CONFLICT (business_id, name) DO UPDATE SET role = EXCLUDED.role, department = EXCLUDED.department, email = EXCLUDED.email
    RETURNING id INTO neha_id;

    -- Ensure 13 Demo Tasks with Relative Deadlines
    INSERT INTO public.tasks (seed_key, business_id, assignee_id, title, description, priority, status, due_at, category, completed_at)
    VALUES
        ('collect-paper-stock', biz_id, neha_id, 'Collect paper stock from supplier', 'Pick up the ordered A4 gloss stock; supplier confirmed readiness.', 'MEDIUM', 'TODO', now_ts - INTERVAL '2 days', 'Inventory', NULL),
        ('dispatch-brochure-1042', biz_id, arjun_id, 'Dispatch brochure order #1042', 'Customer awaiting the 200-brochure batch; courier slot booked.', 'HIGH', 'TODO', now_ts - INTERVAL '1 day', 'Dispatch', NULL),
        ('fix-color-calibration', biz_id, arjun_id, 'Fix color calibration on press 2', 'Blocked: waiting for replacement calibration kit from vendor.', 'CRITICAL', 'BLOCKED', now_ts - INTERVAL '6 hours', 'Printing', NULL),
        ('send-invoice-1039', biz_id, asha_id, 'Send invoice for banner order #1039', 'Invoice pending since the banner was delivered.', 'MEDIUM', 'TODO', now_ts - INTERVAL '3 hours', 'Billing', NULL),
        ('prepare-brochure-draft', biz_id, riya_id, 'Prepare customer brochure draft', 'Finalize the brochure design for customer approval.', 'HIGH', 'IN_PROGRESS', now_ts + INTERVAL '4 hours', 'Design', NULL),
        ('design-festival-flyer', biz_id, riya_id, 'Design festival discount flyer', 'First pass due today; content approved by Asha.', 'MEDIUM', 'TODO', now_ts + INTERVAL '8 hours', 'Design', NULL),
        ('update-website-pricing', biz_id, asha_id, 'Update website service pricing', 'Reflect new lamination and binding prices.', 'LOW', 'TODO', now_ts + INTERVAL '3 days', 'Website', NULL),
        ('restock-lamination-rolls', biz_id, neha_id, 'Restock lamination rolls', 'Two rolls left; reorder from usual vendor.', 'LOW', 'IN_PROGRESS', now_ts + INTERVAL '2 days', 'Inventory', NULL),
        ('approve-brochure-proof', biz_id, asha_id, 'Approve brochure proof', 'Customer waiting on owner sign-off before printing.', 'HIGH', 'TODO', now_ts + INTERVAL '2 hours', 'Design', NULL),
        ('schedule-social-posts', biz_id, neha_id, 'Schedule social media posts', 'Week-long post queue published.', 'LOW', 'COMPLETED', now_ts - INTERVAL '1 day', 'Marketing', now_ts - INTERVAL '1 day'),
        ('deliver-business-cards', biz_id, arjun_id, 'Deliver business cards to Ritika', 'Handed over and signed for.', 'MEDIUM', 'COMPLETED', now_ts - INTERVAL '2 days', 'Dispatch', now_ts - INTERVAL '2 days'),
        ('archive-job-files', biz_id, riya_id, 'Archive last month''s job files', 'Old job folders moved to archive drive.', 'LOW', 'COMPLETED', now_ts - INTERVAL '3 days', 'Admin', now_ts - INTERVAL '3 days'),
        ('visiting-card-artwork', biz_id, riya_id, 'Prepare visiting card artwork', 'Layout awaiting the customer''s final logo file.', 'MEDIUM', 'TODO', now_ts + INTERVAL '2 days', 'Design', NULL)
    ON CONFLICT (seed_key) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        priority = EXCLUDED.priority,
        status = EXCLUDED.status,
        due_at = EXCLUDED.due_at,
        category = EXCLUDED.category,
        completed_at = EXCLUDED.completed_at,
        updated_at = now_ts;
END $$;
