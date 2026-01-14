import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, AlertCircle } from "lucide-react";

interface QuestionnaireStepProps {
  question: string;
  options: string[];
  onSelect: (index: number) => void;
  onBack?: () => void;
  canGoBack?: boolean;
  isLoading?: boolean;
  stage?: string;
}

export function QuestionnaireStep({
  question,
  options,
  onSelect,
  onBack,
  canGoBack = false,
  isLoading = false,
  stage,
}: QuestionnaireStepProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleSelect = (index: number) => {
    setSelectedIndex(index);
  };

  const handleConfirm = () => {
    if (selectedIndex !== null) {
      onSelect(selectedIndex);
      setSelectedIndex(null);
    }
  };

  const isEmergency = stage?.includes("EMERGENCY") || stage === "START";

  return (
    <div className="animate-fade-in space-y-6">
      {/* Question card */}
      <div className="bg-card rounded-2xl p-6 shadow-lg">
        {isEmergency && (
          <div className="flex items-center gap-2 text-warning mb-3">
            <AlertCircle className="h-5 w-5" />
            <span className="text-sm font-medium">응급 문진</span>
          </div>
        )}
        <h2 className="text-xl font-semibold text-foreground leading-relaxed">
          {question}
        </h2>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => (
          <Button
            key={index}
            variant={selectedIndex === index ? "optionSelected" : "option"}
            className="w-full animate-slide-up"
            style={{ animationDelay: `${index * 0.05}s` }}
            onClick={() => handleSelect(index)}
            disabled={isLoading}
          >
            <span className="flex items-center gap-3">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-sm font-medium text-secondary-foreground">
                {index + 1}
              </span>
              <span className="text-base text-wrap">{option}</span>
            </span>
          </Button>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {canGoBack && onBack && (
          <Button
            variant="outline"
            size="xl"
            className="flex-shrink-0"
            onClick={onBack}
            disabled={isLoading}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        )}
        <Button
          variant="hero"
          size="xl"
          className="flex-1"
          onClick={handleConfirm}
          disabled={selectedIndex === null || isLoading}
        >
          {isLoading ? (
            <span className="animate-pulse-soft">처리 중...</span>
          ) : (
            <>
              다음으로
              <ChevronRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
