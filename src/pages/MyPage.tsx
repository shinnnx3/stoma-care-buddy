import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AppHeader } from "@/components/AppHeader";
import {
  ChevronRight,
  LogOut,
  LucideIcon
} from "lucide-react";
import iconPushNotification from "@/assets/icon-push-notification.png";
import iconCameraReminder from "@/assets/icon-camera-reminder.png";
import iconProfile from "@/assets/icon-profile.png";
import iconDarkmode from "@/assets/icon-darkmode.png";
import iconSettings from "@/assets/icon-settings.png";
import iconHelp from "@/assets/icon-help.png";
import iconTerms from "@/assets/icon-terms.png";
import iconPrivacy from "@/assets/icon-privacy.png";
import { useAuth } from "@/contexts/AuthContext";
import { useDiagnosisHistory } from "@/hooks/useDiagnosisHistory";

type SettingItem = {
  icon?: LucideIcon;
  iconImage?: string;
  label: string;
  type: "toggle" | "link";
  enabled?: boolean;
};

type SettingsGroup = {
  title: string;
  items: SettingItem[];
};

const settingsGroups: SettingsGroup[] = [
  {
    title: "알림 설정",
    items: [
      { iconImage: iconPushNotification, label: "푸시 알림", type: "toggle", enabled: true },
      { iconImage: iconCameraReminder, label: "촬영 리마인더", type: "toggle", enabled: true },
    ]
  },
  {
    title: "앱 설정",
    items: [
      { iconImage: iconDarkmode, label: "다크 모드", type: "toggle", enabled: false },
      { iconImage: iconSettings, label: "일반 설정", type: "link" },
    ]
  },
  {
    title: "지원",
    items: [
      { iconImage: iconHelp, label: "도움말", type: "link" },
      { iconImage: iconTerms, label: "이용약관", type: "link" },
      { iconImage: iconPrivacy, label: "개인정보처리방침", type: "link" },
    ]
  },
];

export default function MyPage() {
  const { records } = useDiagnosisHistory();

  const { signOut } = useAuth()
  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="마이페이지" />

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center overflow-hidden">
              <img src={iconProfile} alt="프로필" className="w-14 h-14 object-contain" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-foreground">사용자님</h2>
              <p className="text-sm text-muted-foreground">장루 관리 시작일: 2025년 12월 1일</p>
            </div>
            <Button variant="outline" size="sm">
              편집
            </Button>
          </div>
        </Card>

        {/* Health Summary Card */}
        <Card className="p-5 bg-blue-50 border-0 rounded-2xl">
          <h3 className="font-semibold text-primary mb-4">나의 건강 요약</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-warning">
                {records.length > 0
                  ? records[0].risk_level === 3 ? "위험" : records[0].risk_level === 2 ? "유의" : "정상"
                  : "-"
                }
              </p>              <p className="text-xs text-muted-foreground mt-1">진단 상태</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {new Set(records.map(r => r.created_at.split('T')[0])).size}
              </p>              <p className="text-xs text-muted-foreground mt-1">총 기록일</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-primary">{records.length}</p>
              <p className="text-xs text-muted-foreground mt-1">촬영 횟수</p>
            </div>
          </div>
        </Card>

        {/* Settings Groups */}
        {settingsGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <h3 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              {group.title}
            </h3>
            <Card className="overflow-hidden">
              {group.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className={`flex items-center justify-between p-4 ${itemIdx !== group.items.length - 1 ? "border-b border-border" : ""
                    }`}
                >
                  <div className="flex items-center gap-3">
                    {item.iconImage ? (
                      <img src={item.iconImage} alt={item.label} className="h-5 w-5 object-contain" />
                    ) : item.icon ? (
                      <item.icon className="h-5 w-5 text-muted-foreground" />
                    ) : null}
                    <span className="font-medium text-foreground">{item.label}</span>
                  </div>
                  {item.type === "toggle" ? (
                    <Switch defaultChecked={item.enabled} />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              ))}
            </Card>
          </div>
        ))}

        {/* Logout Button */}
        <Button onClick={signOut} variant="outline" className="w-full text-destructive hover:text-destructive">
          <LogOut className="h-4 w-4 mr-2" />
          로그아웃
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground">
          루카 v1.0.0
        </p>
      </div>
    </div>
  );
}
