-- Updated_at 함수 생성
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 캘린더 메모 테이블
CREATE TABLE public.calendar_memos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- 체크리스트 테이블
CREATE TABLE public.calendar_checklists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL,
  label TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_memos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_checklists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_memos
CREATE POLICY "Users can view own memos" ON public.calendar_memos FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own memos" ON public.calendar_memos FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own memos" ON public.calendar_memos FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own memos" ON public.calendar_memos FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for calendar_checklists
CREATE POLICY "Users can view own checklists" ON public.calendar_checklists FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checklists" ON public.calendar_checklists FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checklists" ON public.calendar_checklists FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own checklists" ON public.calendar_checklists FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_calendar_memos_updated_at
BEFORE UPDATE ON public.calendar_memos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_calendar_checklists_updated_at
BEFORE UPDATE ON public.calendar_checklists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();