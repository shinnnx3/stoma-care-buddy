import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DiagnosisRecord {
  id: string;
  user_id: string;
  image_url: string | null;
  diagnosis: string;
  description: string | null;
  risk_level: number | null;
  brightness: number | null;
  sacs_grade: string | null;
  advice: string | null;
  emergency_alert: string | null;
  created_at: string;
}

export interface SaveDiagnosisParams {
  image_url?: string;
  diagnosis: string;
  description?: string;
  risk_level?: number;
  brightness?: number;
  sacs_grade?: string;
  advice?: string;
  emergency_alert?: string;
}

export function useDiagnosisHistory() {
  const { user } = useAuth();
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    if (!user) {
      setRecords([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from("diagnosis_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log(data)
      setRecords(data || []);
    } catch (err) {
      console.error("Error fetching diagnosis history:", err);
      setError("기록을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const saveDiagnosis = useCallback(async (params: SaveDiagnosisParams) => {
    if (!user) {
      console.warn("Cannot save diagnosis: User not authenticated");
      return { success: false, error: "로그인이 필요합니다" };
    }

    try {
      const { error } = await supabase
        .from("diagnosis_history")
        .insert({
          user_id: user.id,
          image_url: params.image_url || null,
          diagnosis: params.diagnosis,
          description: params.description || null,
          risk_level: params.risk_level || null,
          brightness: params.brightness || null,
          sacs_grade: params.sacs_grade || null,
          advice: params.advice || null,
          emergency_alert: params.emergency_alert || null,
        });

      if (error) throw error;

      // Refresh records after saving
      await fetchRecords();
      return { success: true, error: null };
    } catch (err) {
      console.error("Error saving diagnosis:", err);
      return { success: false, error: "저장에 실패했습니다" };
    }
  }, [user, fetchRecords]);

  const getRecordsByDate = useCallback((date: Date) => {
    // 한국 시간 기준으로 날짜 비교 (UTC+9)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const localDateStr = `${year}-${month}-${day}`;

    return records.filter(record => {
      // created_at을 로컬 시간으로 변환하여 비교
      const recordDate = new Date(record.created_at);
      const recordYear = recordDate.getFullYear();
      const recordMonth = String(recordDate.getMonth() + 1).padStart(2, '0');
      const recordDay = String(recordDate.getDate()).padStart(2, '0');
      const recordLocalDateStr = `${recordYear}-${recordMonth}-${recordDay}`;

      return recordLocalDateStr === localDateStr;
    });
  }, [records]);

  const getRecordsForMonth = useCallback((year: number, month: number) => {
    return records.filter(record => {
      // 로컬 시간 기준으로 월 비교
      const recordDate = new Date(record.created_at);
      return recordDate.getFullYear() === year && recordDate.getMonth() === month;
    });
  }, [records]);

  // 7일 전 기록 조회 (±2일 범위로 찾음)
  const getRecordFromDaysAgo = useCallback((daysAgo: number = 7) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - daysAgo);

    // ±2일 범위 허용 (5~9일 전 기록 중 가장 가까운 것)
    const minDate = new Date(targetDate);
    minDate.setDate(minDate.getDate() - 2);
    const maxDate = new Date(targetDate);
    maxDate.setDate(maxDate.getDate() + 2);

    const recordsInRange = records.filter(record => {
      const recordDate = new Date(record.created_at);
      return recordDate >= minDate && recordDate <= maxDate;
    });

    // 가장 targetDate에 가까운 기록 반환
    if (recordsInRange.length === 0) return null;

    return recordsInRange.reduce((closest, record) => {
      const recordDate = new Date(record.created_at);
      const closestDate = new Date(closest.created_at);
      const recordDiff = Math.abs(recordDate.getTime() - targetDate.getTime());
      const closestDiff = Math.abs(closestDate.getTime() - targetDate.getTime());
      return recordDiff < closestDiff ? record : closest;
    });
  }, [records]);

  // 7일 전 밝기값 조회
  const getBrightnessFromDaysAgo = useCallback((daysAgo: number = 7): number | null => {
    const record = getRecordFromDaysAgo(daysAgo);
    return record?.brightness ?? null;
  }, [getRecordFromDaysAgo]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  return {
    records,
    isLoading,
    error,
    fetchRecords,
    saveDiagnosis,
    getRecordsByDate,
    getRecordsForMonth,
    getRecordFromDaysAgo,
    getBrightnessFromDaysAgo,
  };
}
