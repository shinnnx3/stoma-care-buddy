import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export interface CalendarMemo {
  id: string;
  user_id: string;
  date: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  user_id: string;
  date: string;
  label: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export function useCalendarData() {
  const { user } = useAuth();
  const [memos, setMemos] = useState<CalendarMemo[]>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch all memos
  const fetchMemos = useCallback(async () => {
    if (!user) {
      setMemos([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("calendar_memos")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false });

      if (error) throw error;
      setMemos(data || []);
    } catch (err) {
      console.error("Error fetching memos:", err);
    }
  }, [user]);

  // Fetch all checklists
  const fetchChecklists = useCallback(async () => {
    if (!user) {
      setChecklists([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("calendar_checklists")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setChecklists(data || []);
    } catch (err) {
      console.error("Error fetching checklists:", err);
    }
  }, [user]);

  // Get memo for a specific date
  const getMemoByDate = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return memos.find(memo => memo.date === dateStr);
  }, [memos]);

  // Get checklists for a specific date
  const getChecklistsByDate = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return checklists.filter(item => item.date === dateStr);
  }, [checklists]);

  // Save or update memo
  const saveMemo = useCallback(async (date: Date, content: string) => {
    if (!user) return { success: false, error: "로그인이 필요합니다" };

    const dateStr = format(date, "yyyy-MM-dd");
    const existingMemo = memos.find(m => m.date === dateStr);

    try {
      if (existingMemo) {
        const { error } = await supabase
          .from("calendar_memos")
          .update({ content })
          .eq("id", existingMemo.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("calendar_memos")
          .insert({ user_id: user.id, date: dateStr, content });

        if (error) throw error;
      }

      await fetchMemos();
      return { success: true, error: null };
    } catch (err) {
      console.error("Error saving memo:", err);
      return { success: false, error: "메모 저장에 실패했습니다" };
    }
  }, [user, memos, fetchMemos]);

  // Add checklist item
  const addChecklistItem = useCallback(async (date: Date, label: string) => {
    if (!user) return { success: false, error: "로그인이 필요합니다" };

    const dateStr = format(date, "yyyy-MM-dd");

    try {
      const { error } = await supabase
        .from("calendar_checklists")
        .insert({ user_id: user.id, date: dateStr, label, completed: false });

      if (error) throw error;
      await fetchChecklists();
      return { success: true, error: null };
    } catch (err) {
      console.error("Error adding checklist item:", err);
      return { success: false, error: "체크리스트 추가에 실패했습니다" };
    }
  }, [user, fetchChecklists]);

  // Update checklist item
  const updateChecklistItem = useCallback(async (id: string, updates: Partial<Pick<ChecklistItem, 'label' | 'completed'>>) => {
    if (!user) return { success: false, error: "로그인이 필요합니다" };

    try {
      const { error } = await supabase
        .from("calendar_checklists")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
      await fetchChecklists();
      return { success: true, error: null };
    } catch (err) {
      console.error("Error updating checklist item:", err);
      return { success: false, error: "체크리스트 수정에 실패했습니다" };
    }
  }, [user, fetchChecklists]);

  // Delete checklist item
  const deleteChecklistItem = useCallback(async (id: string) => {
    if (!user) return { success: false, error: "로그인이 필요합니다" };

    try {
      const { error } = await supabase
        .from("calendar_checklists")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await fetchChecklists();
      return { success: true, error: null };
    } catch (err) {
      console.error("Error deleting checklist item:", err);
      return { success: false, error: "체크리스트 삭제에 실패했습니다" };
    }
  }, [user, fetchChecklists]);

  // Toggle checklist item
  const toggleChecklistItem = useCallback(async (id: string) => {
    const item = checklists.find(c => c.id === id);
    if (!item) return { success: false, error: "항목을 찾을 수 없습니다" };
    
    return updateChecklistItem(id, { completed: !item.completed });
  }, [checklists, updateChecklistItem]);

  // Initial fetch
  useEffect(() => {
    const fetchAll = async () => {
      setIsLoading(true);
      await Promise.all([fetchMemos(), fetchChecklists()]);
      setIsLoading(false);
    };
    fetchAll();
  }, [fetchMemos, fetchChecklists]);

  return {
    memos,
    checklists,
    isLoading,
    getMemoByDate,
    getChecklistsByDate,
    saveMemo,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,
    fetchMemos,
    fetchChecklists,
  };
}
