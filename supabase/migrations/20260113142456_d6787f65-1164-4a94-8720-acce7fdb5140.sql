-- Add advice and emergency_alert columns to diagnosis_history table
ALTER TABLE public.diagnosis_history 
ADD COLUMN advice TEXT NULL,
ADD COLUMN emergency_alert TEXT NULL;