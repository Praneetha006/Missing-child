
CREATE TABLE public.sightings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  description text NOT NULL,
  location text NOT NULL,
  latitude double precision,
  longitude double precision,
  image_url text,
  linked_report_id uuid REFERENCES public.reports(id),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.sightings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view all sightings"
  ON public.sightings FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated can create sightings"
  ON public.sightings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.sightings;
