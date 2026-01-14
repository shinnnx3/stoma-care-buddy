import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, AlertCircle, Home, History, Sun, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";

interface DiagnosisResultData {
  type: "result";
  diagnosis: string;
  description: string;
  prescription: string;
  risk_level: string;
  emergency_alert?: string | null;
}

interface BrightnessComparisonData {
  currentBrightness: number;
  previousBrightness: number | null;
  daysAgo: number;
}

interface DiagnosisResultProps {
  result: DiagnosisResultData;
  correctedImageUrl?: string;
  brightnessMessage?: string;
  brightnessComparison?: BrightnessComparisonData;
  onGoHome: () => void;
  onViewHistory: () => void;
}

// 7일 전 밝기 비교 정보 계산
const getBrightnessComparisonInfo = (current: number, previous: number | null, daysAgo: number) => {
  if (previous === null) {
    return {
      icon: Calendar,
      text: `${daysAgo}일 전 기록이 없습니다`,
      subtext: "꾸준히 기록하면 변화를 추적할 수 있어요",
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      percentage: 0,
      hasComparison: false
    };
  }

  const diff = current - previous;
  const percentage = Math.abs((diff / previous) * 100).toFixed(1);

  if (Math.abs(diff) < 0.5) {
    return {
      icon: Minus,
      text: `${daysAgo}일 전과 비슷한 밝기`,
      subtext: `이전: ${previous.toFixed(1)} → 현재: ${current.toFixed(1)}`,
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      percentage: 0,
      hasComparison: true
    };
  }

  if (diff > 0) {
    return {
      icon: TrendingUp,
      text: `${daysAgo}일 전보다 ${percentage}% 밝아짐`,
      subtext: `이전: ${previous.toFixed(1)} → 현재: ${current.toFixed(1)}`,
      color: "text-success",
      bgColor: "bg-success/10",
      percentage: Number(percentage),
      hasComparison: true
    };
  }

  return {
    icon: TrendingDown,
    text: `${daysAgo}일 전보다 ${percentage}% 어두워짐`,
    subtext: `이전: ${previous.toFixed(1)} → 현재: ${current.toFixed(1)}`,
    color: "text-warning",
    bgColor: "bg-warning/10",
    percentage: Number(percentage),
    hasComparison: true
  };
};

export function DiagnosisResult({
  result,
  correctedImageUrl,
  brightnessMessage,
  brightnessComparison,
  onGoHome,
  onViewHistory,
}: DiagnosisResultProps) {
  const getRiskConfig = (level: string | undefined) => {
    switch (level) {
      case "high":
        return {
          icon: AlertTriangle,
          label: "높음",
          color: "text-destructive",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/30",
        };
      case "medium":
        return {
          icon: AlertCircle,
          label: "중간",
          color: "text-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/30",
        };
      default:
        return {
          icon: CheckCircle,
          label: "낮음",
          color: "text-success",
          bgColor: "bg-success/10",
          borderColor: "border-success/30",
        };
    }
  };

  const riskConfig = getRiskConfig(result.risk_level);
  const RiskIcon = riskConfig.icon;

  return (
    <div className="animate-fade-in space-y-6 pb-8">
      {/* Header */}
      <div className="text-center">
        <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${riskConfig.bgColor} mb-4`}>
          <RiskIcon className={`h-8 w-8 ${riskConfig.color}`} />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-1">진단 완료</h1>
        <p className="text-muted-foreground">AI 분석 결과를 확인하세요</p>
      </div>

      {/* Corrected Image */}
      {correctedImageUrl && (
        <div className="bg-card rounded-2xl overflow-hidden shadow-lg">
          <img
            src={correctedImageUrl}
            alt="보정된 장루 이미지"
            className="w-full h-48 object-cover"
          />
          {brightnessMessage && (
            <div className="p-4 flex items-start gap-3 bg-accent/50">
              <Sun className="h-5 w-5 text-accent-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-accent-foreground">{brightnessMessage}</p>
            </div>
          )}
        </div>
      )}

      {/* 7일 전 밝기 비교 */}
      {brightnessComparison && (
        (() => {
          const comparisonInfo = getBrightnessComparisonInfo(
            brightnessComparison.currentBrightness,
            brightnessComparison.previousBrightness,
            brightnessComparison.daysAgo
          );
          const ComparisonIcon = comparisonInfo.icon;

          return (
            <Card className={`p-4 ${comparisonInfo.bgColor} border-0 shadow-lg`}>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${comparisonInfo.bgColor}`}>
                  <ComparisonIcon className={`h-5 w-5 ${comparisonInfo.color}`} />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold ${comparisonInfo.color}`}>
                    {comparisonInfo.text}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {comparisonInfo.subtext}
                  </p>
                </div>
              </div>
              {comparisonInfo.hasComparison && (
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        comparisonInfo.percentage > 0 ? 'bg-success' : comparisonInfo.percentage < 0 ? 'bg-warning' : 'bg-muted-foreground'
                      }`}
                      style={{ width: `${Math.min(Math.abs(comparisonInfo.percentage), 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {comparisonInfo.percentage > 0 ? '+' : ''}{comparisonInfo.percentage.toFixed(1)}%
                  </span>
                </div>
              )}
            </Card>
          );
        })()
      )}

      {/* Diagnosis Card */}
      <div className={`bg-card rounded-2xl p-6 shadow-lg border-2 ${riskConfig.borderColor}`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">진단 결과</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskConfig.bgColor} ${riskConfig.color}`}>
            위험도 {riskConfig.label}
          </span>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-2">
              {result.diagnosis}
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              {result.description}
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Alert */}
      {result.emergency_alert && (
        <div className="bg-destructive/10 border-2 border-destructive/30 rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-destructive mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            긴급 알림
          </h3>
          <p className="text-destructive font-medium leading-relaxed whitespace-pre-line">
            {result.emergency_alert}
          </p>
        </div>
      )}

      {/* Prescription Card */}
      {result.prescription && (
        <div className="bg-card rounded-2xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            권장 조치
          </h3>
          <p className="text-foreground leading-relaxed whitespace-pre-line">
            {result.prescription}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          size="lg"
          onClick={onViewHistory}
          className="w-full"
        >
          <History className="mr-2 h-5 w-5" />
          기록 보기
        </Button>
        <Button
          variant="hero"
          size="lg"
          onClick={onGoHome}
          className="w-full"
        >
          <Home className="mr-2 h-5 w-5" />
          홈으로
        </Button>
      </div>
    </div>
  );
}
