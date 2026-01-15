import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { CameraCapture } from "@/components/CameraCapture";
import { QuestionnaireStep } from "@/components/QuestionnaireStep";
import { DiagnosisResult } from "@/components/DiagnosisResult";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { StepIndicator } from "@/components/StepIndicator";
import { AnalysisResultModal } from "@/components/AnalysisResultModal";
import { uploadImage } from "@/lib/api";
import { useDiagnosisHistory } from "@/hooks/useDiagnosisHistory";
import { useCalendarData } from "@/hooks/useCalendarData";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNextStep,
  startEmergencyQuestionnaire,
  getRiskLevelString,
  type AIClass,
  type Question,
  type FinalResult,
  type RetryResult
} from "@/lib/triage";
import {
  Camera,
  Plus,
  Search,
  Edit3,
  Trash2,
  Bug,
  Check,
  X,
  Loader2,
  User,
  UtensilsCrossed
} from "lucide-react";
import { toast } from "sonner";
import iconMedicalRecord from "@/assets/icon-medical-record.png";
import iconCalendar from "@/assets/icon-calendar.png";
import iconInfo from "@/assets/icon-info.png";
import iconPhotoCapture from "@/assets/icon-photo-capture.png";
import iconMealkit from "@/assets/icon-mealkit.png";
type HomeView = "main" | "camera" | "questionnaire" | "result" | "debug";

export default function Home() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { saveDiagnosis, records, getBrightnessFromDaysAgo } = useDiagnosisHistory();
  const {
    getChecklistsByDate,
    addChecklistItem,
    updateChecklistItem,
    deleteChecklistItem,
    toggleChecklistItem,
    isLoading: checklistLoading
  } = useCalendarData();

  const [view, setView] = useState<HomeView>("main");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Checklist state
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [newChecklistLabel, setNewChecklistLabel] = useState("");
  const [editingChecklistId, setEditingChecklistId] = useState<string | null>(null);
  const [editingChecklistLabel, setEditingChecklistLabel] = useState("");

  // Analysis result modal state
  const [isAnalysisModalOpen, setIsAnalysisModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    imageUrl: string;
    necrosisClass: number;
    brightnessVal: number;
    brightnessMessage?: string;
  } | null>(null);

  // Diagnosis state
  const [correctedImageUrl, setCorrectedImageUrl] = useState<string | null>(null);
  const [brightnessMessage, setBrightnessMessage] = useState<string | null>(null);
  const [currentBrightness, setCurrentBrightness] = useState<number | null>(null);
  const [aiClass, setAiClass] = useState<AIClass>(1);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [savedDiagnosis, setSavedDiagnosis] = useState<string>("");
  const [finalResult, setFinalResult] = useState<FinalResult | null>(null);
  const [questionHistory, setQuestionHistory] = useState<{ question: Question; diagnosis: string }[]>([]);

  // Get today's checklists
  const todayChecklists = useMemo(() => getChecklistsByDate(new Date()), [getChecklistsByDate]);

  // Checklist handlers
  const handleAddChecklist = async () => {
    if (!newChecklistLabel.trim()) return;

    const result = await addChecklistItem(new Date(), newChecklistLabel.trim());
    if (result.success) {
      setNewChecklistLabel("");
      setIsAddingChecklist(false);
      toast.success("체크리스트가 추가되었습니다");
    } else {
      toast.error(result.error || "추가에 실패했습니다");
    }
  };

  const handleUpdateChecklist = async (id: string) => {
    if (!editingChecklistLabel.trim()) return;

    const result = await updateChecklistItem(id, { label: editingChecklistLabel.trim() });
    if (result.success) {
      setEditingChecklistId(null);
      setEditingChecklistLabel("");
      toast.success("수정되었습니다");
    } else {
      toast.error(result.error || "수정에 실패했습니다");
    }
  };

  const handleDeleteChecklist = async (id: string) => {
    const result = await deleteChecklistItem(id);
    if (result.success) {
      toast.success("삭제되었습니다");
    } else {
      toast.error(result.error || "삭제에 실패했습니다");
    }
  };

  const handleToggleChecklist = async (id: string) => {
    await toggleChecklistItem(id);
  };

  const startEditingChecklist = (id: string, label: string) => {
    setEditingChecklistId(id);
    setEditingChecklistLabel(label);
  };

  const resetDiagnosis = useCallback(() => {
    setCorrectedImageUrl(null);
    setBrightnessMessage(null);
    setCurrentBrightness(null);
    setAiClass(1);
    setCurrentQuestion(null);
    setSavedDiagnosis("");
    setFinalResult(null);
    setQuestionHistory([]);
  }, []);

  const handleStartDiagnosis = useCallback(() => {
    resetDiagnosis();
    setView("camera");
  }, [resetDiagnosis]);

  // 디버그용: AI 클래스를 직접 선택하여 문진 시작
  const handleDebugStart = useCallback((selectedClass: AIClass) => {
    resetDiagnosis();
    setAiClass(selectedClass);
    // 응급 문진부터 시작
    const firstQuestion = startEmergencyQuestionnaire();
    setCurrentQuestion(firstQuestion);
    setView("questionnaire");
  }, [resetDiagnosis]);

  const handleImageCapture = useCallback(async (imageBlob: Blob) => {
    try {
      setIsLoading(true);
      setLoadingMessage("이미지 분석 중...");

      // 실제 user.id 전달, 없으면 anonymous
      const userId = user?.id || "anonymous";
      const uploadResult = await uploadImage(imageBlob, userId);
      console.log("Image upload result:", uploadResult);
      console.log("Original URL:", uploadResult.data.original_image_url);
      console.log("Corrected URL:", uploadResult.data.corrected_image_url);
      console.log("Brightness:", uploadResult.data.brightness);

      // 분석 결과 저장
      setCorrectedImageUrl(uploadResult.data.corrected_image_url);
      setBrightnessMessage(null); // 백엔드에서 더 이상 제공하지 않음
      setCurrentBrightness(uploadResult.data.brightness); // 현재 밝기값 저장

      // AI 클래스 설정 (1, 2, 3, 4 중 하나)
      const classNum = uploadResult.data.necrosis_class as AIClass;
      setAiClass(classNum || 1);

      // 분석 결과 모달 데이터 설정 및 표시
      setAnalysisResult({
        imageUrl: uploadResult.data.corrected_image_url,
        necrosisClass: classNum || 1,
        brightnessVal: uploadResult.data.brightness,
        brightnessMessage: undefined
      });

      setIsAnalysisModalOpen(true);
      setView("main"); // 메인 뷰로 돌아가고 모달만 표시
    } catch (error) {
      console.error("Error during image upload:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Detailed error:", errorMessage);
      alert(`서버 연결 실패: ${errorMessage}\n디버그 모드로 진행합니다.`);
      // 서버 실패 시 디버그 모드로 전환
      setView("debug");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleContinueToQuestionnaire = useCallback(() => {
    // 모달 닫기
    setIsAnalysisModalOpen(false);

    // 내부 문진 시스템으로 응급 문진 시작
    const firstQuestion = startEmergencyQuestionnaire();
    setCurrentQuestion(firstQuestion);
    setView("questionnaire");
  }, []);

  const handleCloseAnalysisModal = useCallback(() => {
    setIsAnalysisModalOpen(false);
    setAnalysisResult(null);
    // 이미지 정보는 유지 (나중에 사용할 수 있음)
  }, []);

  const handleOptionSelect = useCallback(async (selectedIndex: number) => {
    if (!currentQuestion) return;

    try {
      setIsLoading(true);
      setLoadingMessage("다음 질문 준비 중...");

      // 현재 질문을 히스토리에 저장
      setQuestionHistory(prev => [...prev, {
        question: currentQuestion,
        diagnosis: currentQuestion.temp_diagnosis || savedDiagnosis
      }]);

      // 다음 단계 가져오기 (savedDiagnosis 전달)
      const nextStep = getNextStep(
        currentQuestion.id,
        selectedIndex,
        aiClass,
        currentQuestion.temp_diagnosis || savedDiagnosis
      );

      if (nextStep.type === "question") {
        // 다음 질문으로 이동 - temp_diagnosis가 있으면 저장
        const nextQuestion = nextStep as Question;
        if (nextQuestion.temp_diagnosis) {
          setSavedDiagnosis(nextQuestion.temp_diagnosis);
        }
        setCurrentQuestion(nextQuestion);
      } else if (nextStep.type === "result") {
        // 최종 결과
        const result = nextStep as FinalResult;
        setFinalResult(result);
        setView("result");

        // 데이터베이스에 결과 저장 (모든 정보 포함)
        await saveDiagnosis({
          diagnosis: result.diagnosis,
          description: result.description,
          risk_level: result.risk_level,
          brightness: currentBrightness ?? undefined,
          image_url: correctedImageUrl || undefined,
          advice: result.advice || undefined,
          emergency_alert: result.emergency_alert || undefined,
        });
      } else if (nextStep.type === "retry") {
        // 재촬영 요청
        const retryStep = nextStep as RetryResult;
        alert(retryStep.diagnosis);
        // 이미지 삭제하고 카메라로 돌아가기
        setCorrectedImageUrl(null);
        setQuestionHistory([]);
        setView("camera");
      }
    } catch (error) {
      console.error("Error during questionnaire:", error);
      alert("문진 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentQuestion, aiClass, correctedImageUrl, savedDiagnosis]);

  const handleGoBack = useCallback(() => {
    if (questionHistory.length === 0) {
      // 히스토리가 없으면 메인으로
      setView("main");
      return;
    }

    // 마지막 질문으로 돌아가기
    const newHistory = [...questionHistory];
    const lastState = newHistory.pop();

    if (lastState) {
      setCurrentQuestion(lastState.question);
      setSavedDiagnosis(lastState.diagnosis);
      setQuestionHistory(newHistory);
    }
  }, [questionHistory]);

  const handleGoHome = useCallback(() => {
    resetDiagnosis();
    setView("main");
  }, [resetDiagnosis]);

  // Listen for openCamera event from BottomNav
  useEffect(() => {
    const handleOpenCamera = () => {
      handleStartDiagnosis();
    };

    window.addEventListener('openCamera', handleOpenCamera);
    return () => {
      window.removeEventListener('openCamera', handleOpenCamera);
    };
  }, [handleStartDiagnosis]);

  // Debug mode view - AI 클래스 선택 화면
  if (view === "debug") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6">
          <div className="text-center mb-8">
            <Bug className="h-12 w-12 text-warning mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-2">디버그 모드</h1>
            <p className="text-muted-foreground">
              서버 연결 없이 문진을 테스트합니다.<br />
              AI 클래스를 선택해주세요.
            </p>
          </div>

          <div className="space-y-4">
            <Card
              className="p-6 border-2 border-success/30 bg-success/5 cursor-pointer hover:border-success transition-colors"
              onClick={() => handleDebugStart(1)}
            >
              <h3 className="text-lg font-bold text-success mb-2">클래스 1: 정상/창백함</h3>
              <p className="text-sm text-muted-foreground">
                장루 색상이 정상이거나 창백한 경우의 문진 흐름을 테스트합니다.
              </p>
            </Card>

            <Card
              className="p-6 border-2 border-warning/30 bg-warning/5 cursor-pointer hover:border-warning transition-colors"
              onClick={() => handleDebugStart(2)}
            >
              <h3 className="text-lg font-bold text-warning mb-2">클래스 2: 발적/염증</h3>
              <p className="text-sm text-muted-foreground">
                장루 주변에 발적이나 염증이 있는 경우의 문진 흐름을 테스트합니다.
              </p>
            </Card>

            <Card
              className="p-6 border-2 border-destructive/30 bg-destructive/5 cursor-pointer hover:border-destructive transition-colors"
              onClick={() => handleDebugStart(3)}
            >
              <h3 className="text-lg font-bold text-destructive mb-2">클래스 3: 변색/괴사</h3>
              <p className="text-sm text-muted-foreground">
                장루가 변색되었거나 괴사가 의심되는 경우의 문진 흐름을 테스트합니다.
              </p>
            </Card>
          </div>

          <Button
            variant="outline"
            size="lg"
            className="w-full mt-6"
            onClick={() => setView("main")}
          >
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  // Camera view
  if (view === "camera") {
    return (
      <>
        <CameraCapture
          onCapture={handleImageCapture}
          onCancel={() => setView("main")}
        />
        {isLoading && <LoadingOverlay message={loadingMessage} />}
      </>
    );
  }

  // Questionnaire view
  if (view === "questionnaire" && currentQuestion) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6">
          <StepIndicator currentStep="questionnaire" />

          {correctedImageUrl && (
            <div className="mb-6 rounded-2xl overflow-hidden shadow-lg">
              <img
                src={correctedImageUrl}
                alt="분석 중인 이미지"
                className="w-full h-32 object-cover"
              />
            </div>
          )}

          <QuestionnaireStep
            question={currentQuestion.text}
            options={currentQuestion.options}
            onSelect={handleOptionSelect}
            onBack={handleGoBack}
            canGoBack={true}
            isLoading={isLoading}
            stage={currentQuestion.id}
          />
        </div>
        {isLoading && <LoadingOverlay message={loadingMessage} />}
      </div>
    );
  }

  // Result view
  if (view === "result" && finalResult) {
    // Convert internal result to the format expected by DiagnosisResult component
    const resultForDisplay = {
      type: "result" as const,
      diagnosis: finalResult.diagnosis,
      description: finalResult.description,
      prescription: finalResult.advice,
      risk_level: getRiskLevelString(finalResult.risk_level),
      emergency_alert: finalResult.emergency_alert,
    };

    // 7일 전 밝기값과 비교 데이터 준비
    const brightnessComparisonData = currentBrightness !== null ? {
      currentBrightness: currentBrightness,
      previousBrightness: getBrightnessFromDaysAgo(7),
      daysAgo: 7
    } : undefined;

    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="max-w-lg mx-auto px-4 py-6">
          <StepIndicator currentStep="result" />
          <DiagnosisResult
            result={resultForDisplay}
            correctedImageUrl={correctedImageUrl || undefined}
            brightnessMessage={brightnessMessage || undefined}
            brightnessComparison={brightnessComparisonData}
            onGoHome={handleGoHome}
            onViewHistory={() => navigate("/calendar")}
          />
        </div>
      </div>
    );
  }

  // Main home view
  return (
    <div className="min-h-screen bg-primary pb-24">
      {/* Header Section */}
      <div className="px-4 pt-6 pb-4">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block px-3 py-1 bg-primary-foreground/20 rounded-full text-xs font-medium text-primary-foreground mb-2">
              총 {records.length}회 검사 완료
            </span>
            <h1 className="text-2xl font-bold text-primary-foreground">오늘도 잘 하고 있어요</h1>
            <p className="text-primary-foreground/70 text-sm mt-1">
              {records.length > 0
                ? `최근 검사: ${new Date(records[0].created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}`
                : "아직 검사 기록이 없습니다"
              }
            </p>
          </div>
          <button
            onClick={() => signOut()}
            className="w-12 h-12 rounded-full bg-primary-foreground/20 overflow-hidden hover:bg-primary-foreground/30 transition-colors"
          >
            <div className="w-full h-full bg-gradient-to-br from-amber-200 to-amber-400 flex items-center justify-center">
              <User className="h-6 w-6 text-amber-900" />
            </div>
          </button>
        </div>

        {/* Health Summary Card */}
        <Card className="p-4 bg-card/95 backdrop-blur border-0">
          <p className="text-primary font-semibold text-sm mb-3">나의 건강 요약</p>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xl font-bold text-warning">
                {records.length > 0
                  ? records[0].risk_level === 2 ? "위험" : records[0].risk_level === 1 ? "유의" : "정상"
                  : "-"
                }
              </p>
              <p className="text-xs text-muted-foreground">진단 상태</p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">
                {new Set(records.map(r => r.created_at.split('T')[0])).size}
              </p>
              <p className="text-xs text-muted-foreground">총 기록일</p>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{records.length}</p>
              <p className="text-xs text-muted-foreground">촬영 횟수</p>
            </div>
          </div>
        </Card>
      </div>

      {/* White Content Area */}
      <div className="bg-background rounded-t-3xl px-4 py-6 space-y-5 min-h-screen">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="혹시 장루가 피부보다 안쪽으로 쏙 들어가 있나요?"
            className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Daily Photo Capture Card */}
        <Card
          className="p-4 border-0 shadow-md bg-card cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleStartDiagnosis}
        >
          <div className="flex items-center gap-4">
            <img src={iconPhotoCapture} alt="사진 촬영" className="w-14 h-14 object-contain" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">일별 사진 촬영 바로가기</h3>
              <p className="text-xs text-muted-foreground mt-0.5">오늘 아직 사진을 촬영하지 않았어요! 하루 1회 촬영을 권장합니다</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">의료기록</span>
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full font-medium">안심관리</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Debug Button */}
        <Card
          className="p-3 border-2 border-dashed border-warning/50 bg-warning/5 cursor-pointer hover:border-warning transition-colors"
          onClick={() => setView("debug")}
        >
          <div className="flex items-center gap-3">
            <Bug className="h-5 w-5 text-warning" />
            <div>
              <p className="font-medium text-warning text-sm">디버그 모드 (테스트용)</p>
              <p className="text-xs text-muted-foreground">서버 없이 AI 클래스를 직접 선택하여 문진 테스트</p>
            </div>
          </div>
        </Card>

        {/* Quick Action Icons */}
        <div className="grid grid-cols-3 gap-4">
          <Card
            className="p-4 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow text-center"
            onClick={() => navigate("/calendar")}
          >
            <img src={iconMedicalRecord} alt="진료기록" className="w-14 h-14 mx-auto mb-2 object-contain" />
            <p className="text-sm font-medium text-foreground">진료기록</p>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning mt-1" />
          </Card>

          <Card
            className="p-4 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow text-center"
            onClick={() => navigate("/calendar")}
          >
            <img src={iconCalendar} alt="캘린더" className="w-14 h-14 mx-auto mb-2 object-contain" />
            <p className="text-sm font-medium text-foreground">캘린더</p>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning mt-1" />
          </Card>

          <Card
            className="p-4 border-0 shadow-sm cursor-pointer hover:shadow-md transition-shadow text-center"
            onClick={() => navigate("/info")}
          >
            <img src={iconInfo} alt="정보" className="w-14 h-14 mx-auto mb-2 object-contain" />
            <p className="text-sm font-medium text-foreground">정보</p>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-warning mt-1" />
          </Card>
        </div>

        {/* Checklist Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground">오늘의 체크리스트</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary"
                onClick={() => setIsAddingChecklist(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              {checklistLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            <span className="text-xs text-muted-foreground">
              {todayChecklists.filter(c => c.completed).length}/{todayChecklists.length} 완료
            </span>
          </div>

          <div className="space-y-2">
            {/* Add new checklist input */}
            {isAddingChecklist && (
              <Card className="p-3 border-0 shadow-sm">
                <div className="flex items-center gap-2">
                  <Input
                    value={newChecklistLabel}
                    onChange={(e) => setNewChecklistLabel(e.target.value)}
                    placeholder="새 할 일 입력..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddChecklist();
                      if (e.key === "Escape") {
                        setIsAddingChecklist(false);
                        setNewChecklistLabel("");
                      }
                    }}
                    autoFocus
                  />
                  <Button size="icon" className="h-9 w-9" onClick={handleAddChecklist}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    onClick={() => {
                      setIsAddingChecklist(false);
                      setNewChecklistLabel("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            )}

            {todayChecklists.length > 0 ? (
              todayChecklists.map((item) => (
                <Card
                  key={item.id}
                  className={`p-4 border-0 shadow-sm ${item.completed ? 'bg-primary/5' : 'bg-card'}`}
                >
                  <div className="flex items-center justify-between">
                    {editingChecklistId === item.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-2">
                        <Input
                          value={editingChecklistLabel}
                          onChange={(e) => setEditingChecklistLabel(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateChecklist(item.id);
                            if (e.key === "Escape") {
                              setEditingChecklistId(null);
                              setEditingChecklistLabel("");
                            }
                          }}
                          autoFocus
                        />
                        <Button size="icon" className="h-8 w-8" onClick={() => handleUpdateChecklist(item.id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setEditingChecklistId(null);
                            setEditingChecklistLabel("");
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div
                          className="flex items-center gap-3 cursor-pointer flex-1"
                          onClick={() => handleToggleChecklist(item.id)}
                        >
                          <Checkbox
                            checked={item.completed}
                            onCheckedChange={() => handleToggleChecklist(item.id)}
                            className="h-5 w-5"
                          />
                          <span className={`${item.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                            {item.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground"
                            onClick={() => startEditingChecklist(item.id, item.label)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteChecklist(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              ))
            ) : !isAddingChecklist ? (
              <Card className="p-6 border-0 shadow-sm text-center">
                <p className="text-muted-foreground text-sm">
                  오늘의 체크리스트가 없습니다.<br />
                  <button
                    className="text-primary font-medium mt-1"
                    onClick={() => setIsAddingChecklist(true)}
                  >
                    + 할 일 추가하기
                  </button>
                </p>
              </Card>
            ) : null}
          </div>
        </div>

        {/* Banner - Meal Kit */}
        <Card className="p-5 border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground overflow-hidden relative">
          <div className="relative z-10">
            <h3 className="text-lg font-bold mb-1">장루 환자에 적합한<br />밀키트를 구매하세요</h3>
            <p className="text-sm text-primary-foreground/80 mt-2">
              장루 관리에 부담이 적은 식단,<br />맞춤 밀키트로 시작해보세요!
            </p>
          </div>
          <div className="absolute right-2 bottom-2 w-24 h-24 flex items-center justify-center">
            <img src={iconMealkit} alt="밀키트" className="w-20 h-20 object-contain" />
          </div>
        </Card>

        {/* Hospital Checklist Info */}
        <Card className="p-5 border-0 bg-primary/5">
          <h3 className="text-center font-bold text-primary mb-4">병원 가기 전 필수 체크리스트</h3>
          <ul className="text-sm text-muted-foreground space-y-1.5">
            <li>-신분증 or 모바일 건강보험증</li>
            <li>-기저질환자의 경우 마스크 권장</li>
            <li>-응급의료시 상급종합병원 확인</li>
            <li className="text-xs">응급의료포털(E-Gen), www.e-gen.or.kr</li>
          </ul>
        </Card>
      </div>

      {/* Analysis Result Modal */}
      {analysisResult && (
        <AnalysisResultModal
          isOpen={isAnalysisModalOpen}
          onClose={handleCloseAnalysisModal}
          onContinue={handleContinueToQuestionnaire}
          imageUrl={analysisResult.imageUrl}
          necrosisClass={analysisResult.necrosisClass}
          brightnessVal={analysisResult.brightnessVal}
          brightnessMessage={analysisResult.brightnessMessage}
          previousBrightness={getBrightnessFromDaysAgo(7)}
        />
      )}
    </div>
  );
}
