-- Drop existing restrictive policies that conflict
DROP POLICY IF EXISTS "Users can view own alerts" ON public.alerts;
DROP POLICY IF EXISTS "Users can view own children" ON public.children;

-- All authenticated users can view alerts (for volunteer + parent + admin)
CREATE POLICY "Authenticated can view all alerts"
  ON public.alerts FOR SELECT
  TO authenticated
  USING (true);

-- All authenticated users can view children (volunteers see basic info via app logic)
CREATE POLICY "Authenticated can view all children"
  ON public.children FOR SELECT
  TO authenticated
  USING (true);