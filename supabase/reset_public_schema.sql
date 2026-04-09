-- ==============================================
-- TICKETSHIELD: Reset Public Schema
-- WARNING: This removes all objects and data in public.
-- ==============================================

DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;

GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
