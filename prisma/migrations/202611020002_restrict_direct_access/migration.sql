-- Server-side Prisma uses its private database connection. Supabase clients must
-- not access this aggregate directly through the public Data API.
ALTER TABLE "InventoryState" ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE role_name TEXT;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon', 'authenticated'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format('REVOKE ALL ON TABLE "InventoryState" FROM %I', role_name);
    END IF;
  END LOOP;
END $$;
