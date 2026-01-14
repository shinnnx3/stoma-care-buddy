import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { CameraCapture } from "@/components/CameraCapture";
import { QuestionnaireStep } from "@/components/QuestionnaireStep";
import { DiagnosisResult } from "@/components/DiagnosisResult";
import { HistoryList } from "@/components/HistoryList";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { StepIndicator } from "@/components/StepIndicator";
import { uploadImage, startQuestionnaire, type QuestionResponse } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Camera, History, Heart, Shield, Sparkles } from "lucide-react";

type AppView = "home" | "camera" | "questionnaire" | "result" | "history";

export default function Index() {
  const { user } = useAuth();
  const [view, setView] = useState<AppView>("home");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Diagnosis state
  const [correctedImageUrl, setCorrectedImageUrl] = useState<string | null>(null);
  const [brightnessMessage, setBrightnessMessage] = useState<string | null>(null);
  const [aiClass, setAiClass] = useState<string>("");
  const [currentStage, setCurrentStage] = useState<string>("START");
  const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
  const [finalResult, setFinalResult] = useState<QuestionResponse | null>(null);

  const resetDiagnosis = useCallback(() => {
    setCorrectedImageUrl(null);
    setBrightnessMessage(null);
    setAiClass("");
    setCurrentStage("START");
    setCurrentQuestion(null);
    setFinalResult(null);
  }, []);

  const handleStartDiagnosis = useCallback(() => {
    resetDiagnosis();
    setView("camera");
  }, [resetDiagnosis]);

  const handleImageCapture = useCallback(async (imageBlob: Blob) => {
    try {
      setIsLoading(true);
      setLoadingMessage("이미지 분석 중...");

      // Upload image to server with user ID
      const userId = user?.id || "anonymous";
      const uploadResult = await uploadImage(imageBlob, userId);
      setCorrectedImageUrl(uploadResult.data.corrected_image_url);
      setBrightnessMessage(null);
      setAiClass(String(uploadResult.data.necrosis_class));

      // Show result directly (questionnaire removed)
      setView("result");
    } catch (error) {
      console.error("Error during image upload:", error);
      alert("이미지 업로드 중 오류가 발생했습니다. 다시 시도해주세요.");
      setView("home");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const handleOptionSelect = useCallback(async (selectedIndex: number) => {
    if (!currentQuestion) return;

    try {
      setIsLoading(true);
      setLoadingMessage("다음 질문 준비 중...");

      const nextQuestion = await startQuestionnaire(
        currentStage,
        aiClass,
        selectedIndex
      );

      if (nextQuestion.type === "question") {
        setCurrentQuestion(nextQuestion);
        setCurrentStage(nextQuestion.stage || currentStage);
      } else if (nextQuestion.type === "result") {
        setFinalResult(nextQuestion);
        setView("result");
      }
    } catch (error) {
      console.error("Error during questionnaire:", error);
      alert("문진 처리 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  }, [currentQuestion, currentStage, aiClass]);

  const handleGoHome = useCallback(() => {
    resetDiagnosis();
    setView("home");
  }, [resetDiagnosis]);

  // Render different views
  if (view === "camera") {
    return (
      <>
        <CameraCapture
          onCapture={handleImageCapture}
          onCancel={() => setView("home")}
        />
        {isLoading && <LoadingOverlay message={loadingMessage} />}
      </>
    );
  }

  if (view === "history") {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-lg mx-auto px-4 py-6">
          <HistoryList onBack={() => setView("home")} />
        </div>
      </div>
    );
  }

  if (view === "questionnaire" && currentQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-lg mx-auto px-4 py-6">
          <StepIndicator currentStep="questionnaire" />

          {/* Corrected image preview */}
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
            question={currentQuestion.question || ""}
            options={currentQuestion.options || []}
            onSelect={handleOptionSelect}
            isLoading={isLoading}
            stage={currentStage}
          />
        </div>
        {isLoading && <LoadingOverlay message={loadingMessage} />}
      </div>
    );
  }

  if (view === "result" && finalResult) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container max-w-lg mx-auto px-4 py-6">
          <StepIndicator currentStep="result" />
          <DiagnosisResult
            result={{
              type: "result",
              diagnosis: finalResult.diagnosis || "",
              description: finalResult.description || "",
              prescription: finalResult.prescription || "",
              risk_level: finalResult.risk_level || "low",
            }}
            correctedImageUrl={correctedImageUrl || finalResult.corrected_image_url}
            brightnessMessage={brightnessMessage || finalResult.brightness_message}
            onGoHome={handleGoHome}
            onViewHistory={() => setView("history")}
          />
        </div>
      </div>
    );
  }

  // Home view
  return (
    <div className="min-h-screen gradient-hero">
      <div className="container max-w-lg mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary shadow-primary mb-6">
            <Heart className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            장루 케어 AI
          </h1>
          <p className="text-muted-foreground">
            AI 기반 장루 상태 진단 서비스
          </p>
        </div>

        {/* Main action */}
        <div className="bg-card rounded-3xl p-6 shadow-xl mb-6 animate-slide-up">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              장루 상태 진단하기
            </h2>
            <p className="text-muted-foreground text-sm">
              사진 촬영 후 AI가 상태를 분석하고<br />
              맞춤 문진을 통해 진단합니다
            </p>
          </div>

          <Button
            variant="hero"
            size="xl"
            className="w-full"
            onClick={handleStartDiagnosis}
          >
            <Camera className="mr-2 h-6 w-6" />
            진단 시작
          </Button>
        </div>

        {/* Secondary action */}
        <Button
          variant="outline"
          size="lg"
          className="w-full mb-8"
          onClick={() => setView("history")}
        >
          <History className="mr-2 h-5 w-5" />
          진단 기록 보기
        </Button>

        {/* Features */}
        <div className="grid grid-cols-2 gap-4 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="bg-card rounded-2xl p-5 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3">
              <Sparkles className="h-5 w-5 text-accent-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">AI 분석</h3>
            <p className="text-sm text-muted-foreground">
              딥러닝 기반 정확한 상태 분석
            </p>
          </div>
          <div className="bg-card rounded-2xl p-5 shadow-md">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center mb-3">
              <Shield className="h-5 w-5 text-accent-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">안전 진단</h3>
            <p className="text-sm text-muted-foreground">
              응급 상황 조기 감지
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-10">
          본 서비스는 참고용이며, 정확한 진단은<br />
          반드시 의료 전문가와 상담하세요.
        </p>
      </div>
    </div>
  );
}
