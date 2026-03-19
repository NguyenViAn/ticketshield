-- ==============================================
-- TICKETSHIELD: Admin Security & User Blocking --
-- ==============================================

-- 1. Create Blocked Users Table
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL DEFAULT 'Spam',
    blocked_by UUID REFERENCES auth.users(id),
    blocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. Enable RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

-- 3. Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT COALESCE(
            (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin',
            false
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Helper function: check if a user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.blocked_users WHERE user_id = check_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies for blocked_users — admin only
CREATE POLICY "Admin Read Blocked Users"
ON public.blocked_users FOR SELECT
TO authenticated
USING (public.is_admin());

CREATE POLICY "Admin Insert Blocked Users"
ON public.blocked_users FOR INSERT
TO authenticated
WITH CHECK (public.is_admin());

CREATE POLICY "Admin Delete Blocked Users"
ON public.blocked_users FOR DELETE
TO authenticated
USING (public.is_admin());

-- 6. Admin CRUD policies for existing tables

-- Matches: admin can insert/update/delete
CREATE POLICY "Admin Manage Matches"
ON public.matches FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Tickets: admin can read all tickets
CREATE POLICY "Admin Read All Tickets"
ON public.tickets FOR SELECT
TO authenticated
USING (public.is_admin());

-- Tickets: admin can update any ticket (change status)
CREATE POLICY "Admin Update All Tickets"
ON public.tickets FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Promotions: admin can manage all (read is already public)
CREATE POLICY "Admin Manage Promotions"
ON public.promotions FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 7. Block check: prevent blocked users from purchasing tickets
-- (Add a check constraint or use this in application logic)
CREATE POLICY "Block Blocked Users From Purchasing"
ON public.tickets FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
    AND NOT public.is_user_blocked(auth.uid())
);
