
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS aadhar text UNIQUE,
  ADD COLUMN IF NOT EXISTS address text;

ALTER TABLE public.children
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS emergency_contact_2 text,
  ADD COLUMN IF NOT EXISTS address text;
