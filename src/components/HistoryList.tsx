import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, AlertTriangle, CheckCircle, AlertCircle, ChevronRight } from "lucide-react";
import { fetchDiagnosisHistory, type DiagnosisRecord } from "@/lib/api";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface HistoryListProps {
  onBack: () => void;
}

export function HistoryList({ onBack }: HistoryListProps) {
  const [records, setRecords] = useState<DiagnosisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<DiagnosisRecord | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        setIsLoading(true);
        const data = await fetchDiagnosisHistory();
        setRecords(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch history:", err);
        setError("기록을 불러오는데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    };

    loadHistory();
  }, []);

  const getRiskConfig = (level: string) => {
    switch (level) {
      case "high":
        return {
          icon: AlertTriangle,
          label: "높음",
          color: "text-destructive",
          bgColor: "bg-destructive/10",
        };
      case "medium":
        return {
          icon: AlertCircle,
          label: "중간",
          color: "text-warning",
          bgColor: "bg-warning/10",
        };
      default:
        return {
          icon: CheckCircle,
          label: "낮음",
          color: "text-success",
          bgColor: "bg-success/10",
        };
    }
  };

  if (selectedRecord) {
    const riskConfig = getRiskConfig(selectedRecord.risk_level);
    const RiskIcon = riskConfig.icon;

    return (
      <div className="animate-fade-in space-y-6 pb-8">
        <Button
          variant="ghost"
          onClick={() => setSelectedRecord(null)}
          className="-ml-2"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          목록으로
        </Button>

        {selectedRecord.image_url && (
          <div className="rounded-2xl overflow-hidden shadow-lg">
            <img
              src={selectedRecord.image_url}
              alt="진단 이미지"
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        <div className="bg-card rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              {format(new Date(selectedRecord.created_at), "yyyy년 M월 d일 HH:mm", { locale: ko })}
            </span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-foreground">
              {selectedRecord.diagnosis}
            </h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${riskConfig.bgColor} ${riskConfig.color}`}>
              <RiskIcon className="inline h-4 w-4 mr-1" />
              {riskConfig.label}
            </span>
          </div>

          <p className="text-muted-foreground leading-relaxed mb-4">
            {selectedRecord.description}
          </p>

          {selectedRecord.prescription && (
            <div className="pt-4 border-t border-border">
              <h3 className="font-medium text-foreground mb-2">권장 조치</h3>
              <p className="text-muted-foreground whitespace-pre-line">
                {selectedRecord.prescription}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">진단 기록</h1>
          <p className="text-muted-foreground">과거 진단 결과를 확인하세요</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-card rounded-2xl p-5 shadow-md animate-pulse"
            >
              <div className="h-4 bg-muted rounded w-24 mb-3" />
              <div className="h-6 bg-muted rounded w-48 mb-2" />
              <div className="h-4 bg-muted rounded w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-card rounded-2xl p-8 text-center shadow-lg">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            다시 시도
          </Button>
        </div>
      ) : records.length === 0 ? (
        <div className="bg-card rounded-2xl p-8 text-center shadow-lg">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">아직 진단 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((record, index) => {
            const riskConfig = getRiskConfig(record.risk_level);
            const RiskIcon = riskConfig.icon;

            return (
              <button
                key={record.id}
                onClick={() => setSelectedRecord(record)}
                className="w-full bg-card rounded-2xl p-5 shadow-md hover:shadow-lg transition-all text-left animate-slide-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {format(new Date(record.created_at), "M월 d일 HH:mm", { locale: ko })}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${riskConfig.bgColor} ${riskConfig.color}`}>
                        <RiskIcon className="inline h-3 w-3 mr-1" />
                        {riskConfig.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">
                      {record.diagnosis}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {record.description}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-4" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
