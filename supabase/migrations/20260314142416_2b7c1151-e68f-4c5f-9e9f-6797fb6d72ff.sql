
-- Add location columns to alerts table
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
ALTER TABLE public.alerts ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Add photo_url column to children table
ALTER TABLE public.children ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add RFID scan tracking table
CREATE TABLE public.rfid_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID REFERENCES public.children(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  location TEXT NOT NULL DEFAULT 'School',
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notified BOOLEAN NOT NULL DEFAULT false
);

ALTER TABLE public.rfid_scans ENABLE ROW LEVEL SECURITY;

-- Parents can view scans for their children
CREATE POLICY "Users can view own children scans"
  ON public.rfid_scans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow inserts (for scan simulation)
CREATE POLICY "Users can insert scans"
  ON public.rfid_scans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create storage bucket for child photos
INSERT INTO storage.buckets (id, name, public) VALUES ('child-photos', 'child-photos', true);

-- Storage policies for child photos
CREATE POLICY "Authenticated users can upload child photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'child-photos');

CREATE POLICY "Anyone can view child photos"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'child-photos');

CREATE POLICY "Users can update own child photos"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'child-photos');

CREATE POLICY "Users can delete own child photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'child-photos');

-- Enable realtime for rfid_scans
ALTER PUBLICATION supabase_realtime ADD TABLE public.rfid_scans;
