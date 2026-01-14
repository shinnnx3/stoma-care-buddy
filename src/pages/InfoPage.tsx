import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  BookOpen,
  HelpCircle,
  Sparkles,
  Heart,
  Shield,
  Droplets,
  ChevronRight,
  Camera,
  BarChart3,
  RotateCw,
  MapPin,
  Phone,
  Clock
} from "lucide-react";
import iconStomaIntro from "@/assets/icon-stoma-intro.png";
import iconStomaCare from "@/assets/icon-stoma-care.png";
import iconComplications from "@/assets/icon-complications.png";
import iconCareGuide from "@/assets/icon-care-guide.png";

const categories = [
  {
    id: "1",
    icon: iconStomaIntro,
    title: "장루란?"
  },
  {
    id: "2",
    icon: iconStomaCare,
    title: "장루 관리 방법"
  },
  {
    id: "3",
    icon: iconComplications,
    title: "합병증 소개"
  },
  {
    id: "4",
    icon: iconCareGuide,
    title: "관리 가이드"
  },
];

const faqs = [
  {
    question: "장루 파우치는 얼마나 자주 교체해야 하나요?",
    answer: "일반적으로 1-2일에서 3-4일에 한 번 교체합니다. 하지만 개인의 상태와 사용하는 제품에 따라 다를 수 있으니, 의료진의 지시를 따르세요."
  },
  {
    question: "장루 주변 피부가 빨개졌어요. 어떻게 해야 하나요?",
    answer: "피부 자극의 원인을 파악하는 것이 중요합니다. 파우치 크기가 적절한지, 알레르기 반응은 없는지 확인하고, 증상이 지속되면 의료진과 상담하세요."
  },
  {
    question: "AI 분석은 어떻게 작동하나요?",
    answer: "루카 AI는 촬영된 장루 이미지를 분석하여 색상, 크기, 피부 상태 등을 확인합니다. 정확도 향상을 위해 지속적으로 개선되고 있지만, 정확한 진단은 반드시 의료 전문가와 상담하세요."
  },
  {
    question: "운동을 해도 되나요?",
    answer: "대부분의 운동은 장루가 있어도 가능합니다. 다만 무리한 복부 운동이나 접촉 스포츠는 주의가 필요합니다. 운동 시작 전 의료진과 상담하여 적절한 운동 계획을 세우세요."
  },
];

const officeInfo = {
  name: "장루 전문 클리닉",
  address: "서울특별시 강남구 테헤란로 123",
  phone: "02-1234-5678",
  hours: "평일 09:00 - 18:00"
};

export default function InfoPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-foreground">정보</h1>
        <p className="text-sm text-muted-foreground mt-1">장루 관리에 필요한 모든 정보</p>
      </div>

      <div className="px-5 space-y-8">
        {/* Categories Section */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">카테고리</h2>
          <div className="grid grid-cols-4 gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-105">
                  <img src={category.icon} alt={category.title} className="w-16 h-16 object-contain" />
                </div>
                <span className="text-xs text-foreground font-medium text-center leading-tight">
                  {category.title}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Featured Content Section */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">추천 콘텐츠</h2>
          <Card className="overflow-hidden bg-gradient-to-br from-primary to-primary/80 border-0 text-primary-foreground p-5 relative">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-1">
                AI가 알려주는 건강한
              </h3>
              <h3 className="text-xl font-bold text-primary-foreground/90 mb-3">
                장루 관리 5가지 팁
              </h3>
              <p className="text-sm text-primary-foreground/80 leading-relaxed">
                매일의 작은 습관이 장루 건강을 지킵니다. AI 분석 데이터를 기반으로 한 실천 가이드를 확인하세요.
              </p>
            </div>
            {/* Decorative elements */}
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-primary-foreground/10" />
            <div className="absolute -bottom-4 -right-4 w-32 h-32 rounded-full bg-primary-foreground/5" />
          </Card>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">자주 묻는 질문</h2>
          <div className="space-y-2">
            <Accordion type="single" collapsible className="w-full space-y-2">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  className="border border-border rounded-xl px-4 data-[state=open]:bg-muted/30"
                >
                  <AccordionTrigger className="text-left text-sm font-medium py-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <span className="text-primary font-bold">Q</span>
                      <span>{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-4 pl-7">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* Office Information Section */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">Office information</h2>
          <Card className="overflow-hidden border">
            {/* Map placeholder */}
            <div className="h-40 bg-muted relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <MapPin className="h-8 w-8 text-primary" />
                  <span className="text-sm">지도 영역</span>
                </div>
              </div>
            </div >
            {/* Office details */}
            < div className="p-4 space-y-3" >
              <div className="flex items-center gap-3">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{officeInfo.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{officeInfo.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{officeInfo.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{officeInfo.hours}</span>
              </div>
            </div >
          </Card >
        </section >
      </div >
    </div >
  );
}
