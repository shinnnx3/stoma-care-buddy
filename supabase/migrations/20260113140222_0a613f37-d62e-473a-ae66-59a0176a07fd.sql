-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create diagnosis_history table
CREATE TABLE public.diagnosis_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT,
  diagnosis TEXT NOT NULL,
  description TEXT,
  risk_level INTEGER CHECK (risk_level >= 1 AND risk_level <= 3),
  brightness FLOAT,
  sacs_grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.diagnosis_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own records
CREATE POLICY "Users can view own diagnosis records"
  ON public.diagnosis_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own records
CREATE POLICY "Users can insert own diagnosis records"
  ON public.diagnosis_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own records
CREATE POLICY "Users can update own diagnosis records"
  ON public.diagnosis_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own records
CREATE POLICY "Users can delete own diagnosis records"
  ON public.diagnosis_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries by user_id and created_at
CREATE INDEX idx_diagnosis_history_user_id ON public.diagnosis_history(user_id);
CREATE INDEX idx_diagnosis_history_created_at ON public.diagnosis_history(created_at DESC);