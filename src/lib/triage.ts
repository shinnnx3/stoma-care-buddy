// triage.ts
// 데이터 기반 문진 엔진 (Data-Driven Triage Engine)
// triage-2.py 로직 완전 이식

export type RiskLevel = 0 | 1 | 2; // 0: 정상(초록), 1: 주의(노랑), 2: 위험(빨강)
export type AIClass = 1 | 2 | 3;

// ==========================================
// 타입 정의
// ==========================================

export interface Question {
  id: string;
  type: "question";
  text: string;
  options: string[];
  temp_diagnosis?: string; // 누적 진단명 (to_common에서 사용)
}

export interface FinalResult {
  type: "result";
  diagnosis: string;
  description: string;
  advice: string;
  emergency_alert: string | null;
  risk_level: RiskLevel;
}

export interface RetryResult {
  type: "retry";
  diagnosis: string;
  action: "camera";
  delete_image: boolean;
}

export interface CameraRequest {
  type: "camera_request";
  message: string;
  action: "open_camera";
  next_step_id: string;
}

// 문진 상태 관리
export interface TriageState {
  currentStepId: string;
  aiClass: AIClass;
  savedDiagnosis: string; // 누적된 진단명
  answers: { questionId: string; answerIndex: number }[];
}

export type TriageStep = Question | FinalResult | RetryResult | CameraRequest;

// ==========================================
// 질문 데이터베이스
// ==========================================

export const QUESTIONS: Record<string, { text: string; options: string[] }> = {
  // 응급 질문 (E_Q1 ~ E_Q4)
  E_Q1: { text: "현재 피가 멈추지 않고 계속 흐르나요?", options: ["예", "아니요"] },
  E_Q2: { text: "24시간 이상 가스/대변 배출이 없고 복통/구토가 있나요?", options: ["예", "아니요"] },
  E_Q3: { text: "장루 색깔이 검게/보라색으로 변했거나 창백해졌나요?", options: ["예", "아니요"] },
  E_Q4: { text: "장루가 길게 튀어나와 색이 변했고 장루가 아픈가요?", options: ["예", "아니요"] },

  // 클래스 1: 정상/창백함
  C1_Q1: {
    text: "장루와 주변 피부 색깔이 어떤가요?",
    options: [
      "장루 색깔 자체가 하얗거나 창백하게 변했어요",
      "장루는 빨간데, 주변 피부만 하얗게 불어 터졌거나 쭈글쭈글해요",
      "색깔은 평소처럼 선홍색이고 건강해보여요",
    ],
  },
  C1_Q2: { text: "대변이 가늘게 나오거나 통증이 있나요?", options: ["예", "아니요"] },

  // 클래스 2: 피부염/발적
  C2_Q1: { text: "장루와 피부 사이가 벌어져 속살이 보이나요?", options: ["예", "아니요"] },
  C2_Q2: { text: "최근 장루를 부딪히거나 벨트나 옷에 눌린 적 있나요?", options: ["예", "아니요"] },
  C2_Q2_SUB: {
    text: "통증은 어떤가요?",
    options: ["누르면 좀 욱신거리고 피부는 매끈해요", "스치면 극심한 통증이 있거나, 상처가 파이고 있어요"],
  },
  C2_Q3: {
    text: "붉은 부위 질감/시기가 어떤가요?",
    options: ["목욕탕 다녀온 듯 쭈글쭈글/축축해요", "오래된 자국이고 변화가 없어요", "최근에 생겼고 따가워요"],
  },
  C2_Q4: {
    text: "붉은 발진 외 특징이 있나요?",
    options: [
      "하얀 모래알 같은 것이 있어요",
      "다른 부위에 건선이 있거나 은백색 비늘이 덮여 있어요",
      "붉은 살점이 튀어나왔어요",
      "붉은 반점 주변에 좁쌀 같은 점들이 번져있고 가려워요",
      "장루판 모양 그대로 네모/동그랗게 빨개졌어요",
      "장루 바로 옆 피부에 하얗거나 붉은 사마귀 같은 딱딱하고 오돌토돌한 돌기가 솟아 있어요",
      "없음",
    ],
  },
  C2_Q5: {
    text: "평소 관리 상태가 어떤가요?",
    options: [
      "대변이 자주 새요",
      "안 새는데 뗄 때 아프거나, 껍질이 벗겨졌어요",
      "털구멍에 뾰루지가 났어요",
      "잘 모르겠어요",
    ],
  },
  C2_SACS: {
    text: "현재 피부 상태의 심각도를 골라주세요.",
    options: ["빨갛기만 해요", "껍질이 벗겨지고 진물이 나요", "깊게 파이거나 보라색 테두리에 극심한 통증이 있어요"],
  },

  // 클래스 3: 혈류 및 변색
  C3_Q1: {
    text: "변색 부위 특징을 골라주세요.",
    options: [
      "그림자에요",
      "닦으면 피가 묻어나와요",
      "변비약을 먹었고 장루는 촉촉해요",
      "오래된 흉터이고 통증이 없어요",
      "해당 사항 없어요. 여전히 어둡고 이상해요",
    ],
  },
  C3_Q2: { text: "부딪히거나 다친 적 있나요?", options: ["예", "아니요"] },
  C3_Q2_SUB: {
    text: "통증과 감각은 어떤가요?",
    options: [
      "욱신거리는 멍 통증만 있고, 피부는 따뜻해요",
      "상처 테두리가 보라색이고, 스치기만 해도 매우 아파요",
      "해당 부위가 차갑고, 꼬집어도 아무 느낌이 없어요",
    ],
  },
  C3_Q3: {
    text: "모양과 통증을 설명해주세요.",
    options: [
      "지렁이처럼 구불구불하게 튀어나온 보라색/푸른색 혈관이 보여요",
      "상처 테두리가 보라색이고 스치기만 해도 매우 아파요",
      "통증이 없거나 둔하고, 조직이 검게 말라가거나 딱딱해요",
      "해당 없음",
    ],
  },

  // 공통 마무리 질문
  COMMON_Q1: {
    text: "[마지막] 장루의 모양이나 높이가 평소와 다른가요?",
    options: [
      "장루가 평소보다 길게(코끼리 코처럼) 튀어나왔어요",
      "장루 끝이 피부와 높이가 비슷하거나 움푹 들어가있어요",
      "기침할 때 장루 주변 피부(배)가 둥글게 불룩 솟아올라요",
      "평소와 같아요",
    ],
  },
};

// ==========================================
// 처방전 데이터베이스
// ==========================================

interface TreatmentInfo {
  description: string;
  advice: string;
  emergency_alert: string | null;
}

export const TREATMENT_DATA: Record<string, TreatmentInfo> = {
  "활동성 출혈": {
    description: "지혈되지 않는 활동성 출혈이 감지되었습니다.",
    advice: "출혈량이 많습니다. 깨끗한 거즈나 수건으로 부위를 압박하십시오.",
    emergency_alert: "즉시 응급실로 가십시오!",
  },
  장폐색: {
    description: "장이 막힌 '장폐색'이 의심됩니다.",
    advice: "따뜻한 물을 마시고, 가벼운 걷기나 시계 방향 마사지를 하세요. 음식 섭취를 중단하십시오.",
    emergency_alert: "복통이 심해지거나 구토가 동반되면 즉시 응급실로 이동하십시오.",
  },
  "급성 괴사": {
    description: "조직이 죽어가는 '장루 괴사'가 의심됩니다.",
    advice: "자가 관리로 회복될 수 없습니다. 괴사 부위를 제거하는 수술적 처치가 필요할 수 있습니다.",
    emergency_alert: "장루 전체가 썩어 들어갈 위험이 있습니다. 지금 즉시 응급실로 가십시오!",
  },
  괴사: {
    description: "조직이 죽어가는 '장루 괴사'가 의심됩니다.",
    advice: "자가 관리로 회복될 수 없습니다. 괴사 부위를 제거하는 수술적 처치가 필요할 수 있습니다.",
    emergency_alert: "장루 전체가 썩어 들어갈 위험이 있습니다. 지금 즉시 응급실로 가십시오!",
  },
  "감돈된 장루 탈출": {
    description: "장루가 심각하게 탈출되어 혈류가 차단될 위험이 있습니다.",
    advice: "억지로 밀어 넣지 마시고 젖은 거즈로 덮으십시오.",
    emergency_alert: "장루 색이 변하고 있습니다. 즉시 응급실로 가십시오!",
  },
  "괴저성 농피증": {
    description: "자가면역 질환인 '괴저성 농피증'이 강력히 의심됩니다.",
    advice: "절대 상처를 뜯거나 소독약으로 세게 닦지 마십시오. 일반 치료로 낫지 않으므로 병원 방문이 필요합니다.",
    emergency_alert: "통증이 심하고 위험한 질환입니다. 즉시 병원으로 가십시오.",
  },
  허혈: {
    description: "혈액 공급 부족으로 인한 '허혈'이 의심됩니다.",
    advice: "자가 치료가 불가능한 상태입니다. 수술 부위 혈관 문제일 수 있습니다.",
    emergency_alert: "장루 괴사로 진행될 수 있으니 지금 즉시 병원(응급실)에 연락하세요.",
  },
  "장루 정맥류": {
    description: "혈관이 확장된 '장루 정맥류'가 의심됩니다.",
    advice: "절대 문지르지 마십시오. 작은 자극에도 대량 출혈이 발생할 수 있습니다.",
    emergency_alert: "출혈이 시작되어 멈추지 않으면 즉시 응급실로 가야 합니다.",
  },
  "장루 탈출": {
    description: "장루가 평소보다 길게 튀어나온 '장루 탈출'이 의심됩니다.",
    advice: "누워서 휴식을 취하면 들어갈 수 있습니다. 복압이 오르는 운동을 피하고 넉넉한 주머니를 사용하세요.",
    emergency_alert: "색이 검게 변하거나 통증이 심하면 즉시 응급실로 가십시오.",
  },
  "장루 함몰": {
    description: "피부 안쪽으로 들어간 '함몰 장루'가 의심됩니다.",
    advice: "배설물이 새기 쉬워 피부 손상이 유발됩니다. 함몰형 볼록판을 사용하면 도움이 됩니다.",
    emergency_alert: null,
  },
  "장루 탈장": {
    description: "장루 주변이 불룩하게 솟은 '장루 탈장'이 의심됩니다.",
    advice: "활동 시 '장루용 복대'를 착용하여 복부를 지지하십시오. 체중 조절과 변비 예방이 중요합니다.",
    emergency_alert: "갑작스러운 극심한 복통이나 구토가 동반되면 '장 감돈'일 수 있습니다. 즉시 응급실로 가십시오.",
  },
  "장루 협착": {
    description: "배설구가 좁아지는 '장루 협착'이 의심됩니다.",
    advice: "변을 묽게 하기 위해 수분 섭취를 늘리십시오. 구멍을 넓히는 시술이 필요할 수 있으니 병원을 예약하십시오.",
    emergency_alert: null,
  },
  "상세 불명의 발적": {
    description: "원인을 알 수 없는 붉은 발진이 지속됩니다.",
    advice: "정확한 진단과 치료를 위해 병원을 방문하십시오.",
    emergency_alert: null,
  },
  "자극성 피부염 [L1]": {
    description: "배설물 누수로 인해 피부가 붉어진 상태가 의심됩니다.",
    advice: "[관리법] 깨끗이 씻고 말린 후, '피부 보호 필름'을 발라주세요. 구멍 크기를 장루에 맞게 줄이십시오.",
    emergency_alert: null,
  },
  "자극성 피부염 [L2]": {
    description: "피부 껍질이 벗겨지고 진물이 나는 상태가 의심됩니다.",
    advice: "[관리법] '파우더 뿌리기 → 털기 → 필름 바르기' 과정을 2~3회 반복하여 인공 보호막을 만드십시오.",
    emergency_alert: null,
  },
  "자극성 피부염 [L3]": {
    description: "피부가 깊게 파이거나 궤양이 생긴 상태가 의심됩니다.",
    advice: "[병원 방문] 자가 치료가 위험할 수 있습니다. 상처가 깊으므로 병원을 방문하여 전문적인 처치를 받으십시오.",
    emergency_alert: null,
  },
  "기계적 손상 [L1]": {
    description: "장루판 제거 시 자극으로 피부가 붉어진 상태가 의심됩니다.",
    advice: "[관리법] 장루판 제거 시 반드시 제거제를 사용하여 부드럽게 떼어내십시오. 보호 필름을 사용하십시오.",
    emergency_alert: null,
  },
  "기계적 손상 [L2]": {
    description: "피부가 찢어져 진물이 나는 상태가 의심됩니다.",
    advice:
      "[관리법] 상처 부위에 파우더를 뿌리고 보호 필름을 덧발라 보호막을 만들어주십시오. 제거제를 꼭 사용하십시오.",
    emergency_alert: null,
  },
  "기계적 손상 [L3]": {
    description: "피부가 깊게 찢어진 심각한 상처가 의심됩니다.",
    advice: "[병원 방문] 상처 봉합이나 전문 드레싱이 필요할 수 있습니다. 병원을 방문하십시오.",
    emergency_alert: null,
  },
  "모낭염 [L1]": {
    description: "털구멍 세균 감염인 '모낭염'이 의심됩니다.",
    advice: "[관리법] 항생제 연고나 파우더를 사용하십시오. 면도 시 가위나 전기 클리퍼를 사용하여 자극을 줄이십시오.",
    emergency_alert: null,
  },
  "모낭염 [L2]": {
    description: "모낭염이 진행되어 고름이 차는 상태입니다.",
    advice: "항생제 연고를 바르고 절대 짜지 마십시오. 심해지면 병원을 방문하세요.",
    emergency_alert: null,
  },
  "모낭염 [L3]": {
    description: "모낭염이 심하게 악화된 상태입니다.",
    advice: "[병원 방문] 경구용 항생제가 필요할 수 있습니다. 병원을 방문하십시오.",
    emergency_alert: null,
  },
  짓무름: {
    description: "습기로 인해 피부가 하얗게 붓는 '짓무름'이 의심됩니다.",
    advice: "핵심은 '건조'입니다. 드라이기(찬바람)로 말리고 파우더와 보호 필름을 사용하여 뽀송하게 만드십시오.",
    emergency_alert: null,
  },
  모낭염: {
    description: "털구멍 세균 감염인 '모낭염'이 의심됩니다.",
    advice: "항생제 연고나 파우더를 사용하십시오. 면도 시 가위나 전기 클리퍼를 사용하여 자극을 줄이십시오.",
    emergency_alert: null,
  },
  "곰팡이 감염": {
    description: "곰팡이균에 의한 '진균 감염'이 의심됩니다.",
    advice: "일반 파우더는 효과가 없습니다. 항진균제 처방을 위해 약국이나 병원을 방문하십시오.",
    emergency_alert: null,
  },
  알레르기: {
    description: "제품 성분에 반응하는 '알레르기 피부염'이 의심됩니다.",
    advice: "사용 중인 장루판이나 장루주머니를 변경하십시오. 심하면 스테로이드 로션 처방이 필요합니다.",
    emergency_alert: null,
  },
  건선: {
    description: "자가면역 질환인 '장루 주위 건선'이 의심됩니다.",
    advice: "전문적인 치료가 필요하므로 병원을 방문하십시오.",
    emergency_alert: null,
  },
  "요산 결정": {
    description: "소변 성분이 굳은 '요산 결정'이 의심됩니다.",
    advice: "식초와 물을 1:1로 섞어 거즈에 적셔 10분간 올려두면 녹습니다. 이후 물로 씻어내세요.",
    emergency_alert: null,
  },
  육아종: {
    description: "붉은 살점이 덧자란 '육아종'이 의심됩니다.",
    advice: "출혈이 잦으니 문지르지 마시고 피부를 말려주세요. 심하면 병원에서 제거해야 합니다.",
    emergency_alert: null,
  },
  "기성 사마귀 병변": {
    description: "만성 자극으로 피부가 두꺼워진 '기성 사마귀 병변'이 의심됩니다.",
    advice: "지속적인 배설물 노출이 원인입니다. 장루판 구멍을 장루 크기에 딱 맞게 줄이십시오.",
    emergency_alert: null,
  },
  "점막피부 분리": {
    description: "장루와 피부 사이가 벌어진 상태입니다.",
    advice: "틈새를 장루 파우더나 연고로 메워서 평평하게 만든 후 장루판을 붙이십시오.",
    emergency_alert: null,
  },
  "단순 타박상": {
    description: "외부 충격에 의한 '단순 타박상'으로 보입니다.",
    advice: "특별한 치료 없이 자연 치유됩니다. 장루판 교체 시 부드럽게 다뤄주세요.",
    emergency_alert: null,
  },
  "단순 타박상 (진한 멍)": {
    description: "외부 충격에 의한 '단순 타박상(진한 멍)'으로 보입니다.",
    advice: "특별한 치료 없이 자연 치유됩니다. 장루판 교체 시 부드럽게 다뤄주세요.",
    emergency_alert: null,
  },
  "외상성 궤양": {
    description: "외상으로 인해 깊은 상처(궤양)이 의심됩니다.",
    advice: "자가 치료가 어려울 수 있습니다. 병원을 방문하여 상처 소독을 받으십시오.",
    emergency_alert: null,
  },
  대장흑색증: {
    description: "변비약 복용으로 인한 '대장흑색증'이 의심됩니다.",
    advice: "단순 색소 침착으로 건강에 해롭지 않습니다. 특별한 치료가 필요 없습니다.",
    emergency_alert: null,
  },
  "붉은 흉터": {
    description: "과거 상처의 흔적(흉터)입니다.",
    advice: "장루와 피부가 건강합니다. 주기적으로 관리해주세요.",
    emergency_alert: null,
  },
  "흉터/색소침착": {
    description: "수술이나 과거 상처로 인한 색소침착입니다.",
    advice: "현재 문제가 없는 상태입니다. 평소대로 관리하십시오.",
    emergency_alert: null,
  },
  정상: {
    description: "장루와 피부가 건강합니다.",
    advice: "현재 상태가 아주 좋습니다. 주기적으로 관리해주세요!",
    emergency_alert: null,
  },
  "진단 불가 (AI 분석 오류)": {
    description: "AI 분석 결과를 확인할 수 없습니다.",
    advice: "다시 촬영하거나 병원을 방문하여 전문가의 진단을 받으십시오.",
    emergency_alert: null,
  },
};

// ==========================================
// 헬퍼 함수
// ==========================================

/**
 * 다중 진단 및 위험도(Risk Level) 계산 함수
 */
function finalResult(diagnosisText: string): FinalResult {
  const foundDescriptions: string[] = [];
  const foundAdvices: string[] = [];
  const foundAlerts: string[] = [];

  // 0: 정상(초록), 1: 주의(노랑), 2: 위험(빨강)
  let maxRiskLevel: RiskLevel = 0;

  // 안전 키워드
  const safeKeywords = ["정상", "흉터", "대장흑색증", "단순 타박상"];

  // L3는 무조건 위험도 2 (위험)으로 설정
  if (diagnosisText.includes("[L3]")) {
    maxRiskLevel = 2;
  }

  // 응급 문진 결과 (E_Q1~E_Q4 관련)는 위험도 2로 설정
  const emergencyKeywords = ["활동성 출혈", "장폐색", "급성 괴사", "괴사", "감돈된 장루 탈출"];
  const hasEmergency = emergencyKeywords.some(keyword => diagnosisText.includes(keyword));
  if (hasEmergency) {
    maxRiskLevel = 2;
  }

  // 진단명에 포함된 모든 키워드를 순회하며 정보 수집
  for (const [keyword, info] of Object.entries(TREATMENT_DATA)) {
    if (diagnosisText.includes(keyword)) {
      foundDescriptions.push(info.description);
      foundAdvices.push(info.advice);

      // 위험도 로직
      if (info.emergency_alert) {
        // 응급 알림이 있으면 무조건 '위험(2)'
        foundAlerts.push(info.emergency_alert);
        maxRiskLevel = 2;
      } else if (maxRiskLevel < 2) {
        // 응급은 아니지만, '정상'이나 '흉터' 같은 안전한 게 아니면 '주의(1)'
        const isSafe = safeKeywords.some((safe) => keyword.includes(safe));

        if (!isSafe && maxRiskLevel < 1) {
          maxRiskLevel = 1;
        }
      }
    }
  }

  // 내용이 없을 때 예외처리
  let finalDesc: string;
  let finalAdvice: string;
  let finalAlert: string | null;

  if (foundDescriptions.length === 0) {
    finalDesc = "상세 진단을 위해 의료진과 상담이 필요합니다.";
    finalAdvice = "가까운 병원을 방문하거나 전담 간호사에게 문의하세요.";
    finalAlert = null;
    maxRiskLevel = 1;
  } else {
    finalDesc = foundDescriptions.join("\n");
    finalAdvice = foundAdvices.join("\n\n[추가 처방]\n");
    finalAlert = foundAlerts.length > 0 ? foundAlerts.join("\n") : null;
  }

  return {
    type: "result",
    diagnosis: diagnosisText,
    description: finalDesc,
    advice: finalAdvice,
    emergency_alert: finalAlert,
    risk_level: maxRiskLevel,
  };
}

/**
 * 재촬영 및 이미지 삭제 함수
 */
function retryResult(message: string): RetryResult {
  return {
    type: "retry",
    diagnosis: message,
    action: "camera",
    delete_image: true,
  };
}

/**
 * 공통 질문으로 넘기기
 */
function toCommon(diagnosisSoFar: string): Question {
  return {
    id: "COMMON_Q1",
    type: "question",
    text: QUESTIONS["COMMON_Q1"].text,
    options: QUESTIONS["COMMON_Q1"].options,
    temp_diagnosis: diagnosisSoFar,
  };
}

/**
 * 질문 객체 생성
 */
function createQuestion(id: string, tempDiagnosis?: string): Question {
  const q = QUESTIONS[id];
  if (!q) {
    // 예외 처리
    return {
      id: "E_Q1",
      type: "question",
      text: QUESTIONS["E_Q1"].text,
      options: QUESTIONS["E_Q1"].options,
    };
  }
  return {
    id,
    type: "question",
    text: q.text,
    options: q.options,
    temp_diagnosis: tempDiagnosis,
  };
}

// ==========================================
// 메인 문진 엔진
// ==========================================

/**
 * 다음 단계 가져오기
 * @param currentStepId 현재 질문 ID
 * @param answerIndex 선택한 답변 인덱스
 * @param aiClass AI 분류 클래스
 * @param savedDiagnosis 이전 단계까지 누적된 진단명
 * @returns 다음 질문, 최종 결과, 또는 재촬영 요청
 */
export function getNextStep(
  currentStepId: string,
  answerIndex: number,
  aiClass: AIClass,
  savedDiagnosis: string = "",
): TriageStep {
  // ----------------------------------------------------
  // 0. 시작 (START) -> 즉시 사진 촬영 요청
  // ----------------------------------------------------
  if (currentStepId === "START") {
    return {
      type: "camera_request",
      message: "진단을 시작합니다. 먼저 장루 상태를 확인할 수 있도록 사진을 촬영해주세요.",
      action: "open_camera",
      next_step_id: "E_Q1",
    };
  }

  // ----------------------------------------------------
  // 1. [Class 0] 응급 선별 (Emergency)
  // ----------------------------------------------------
  if (currentStepId === "E_Q1") {
    if (answerIndex === 0) return finalResult("활동성 출혈");
    else return createQuestion("E_Q2");
  }

  if (currentStepId === "E_Q2") {
    if (answerIndex === 0) return finalResult("장폐색");
    else return createQuestion("E_Q3");
  }

  if (currentStepId === "E_Q3") {
    if (answerIndex === 0) return finalResult("급성 괴사");
    else return createQuestion("E_Q4");
  }

  if (currentStepId === "E_Q4") {
    if (answerIndex === 0) return finalResult("감돈된 장루 탈출");
    else {
      // 응급 아님 -> AI 분석 결과(aiClass)에 따른 2차 문진으로 이동
      if (aiClass === 1) return createQuestion("C1_Q1");
      else if (aiClass === 2) return createQuestion("C2_Q1");
      else if (aiClass === 3) return createQuestion("C3_Q1");
      else return finalResult("진단 불가 (AI 분석 오류)");
    }
  }

  // ----------------------------------------------------
  // 2. [Class 1] 정상/창백함
  // ----------------------------------------------------
  if (currentStepId === "C1_Q1") {
    if (answerIndex === 0) return toCommon("허혈");
    else if (answerIndex === 1) return toCommon("짓무름");
    else return createQuestion("C1_Q2");
  }

  if (currentStepId === "C1_Q2") {
    if (answerIndex === 0) return toCommon("장루 협착");
    else return toCommon("정상");
  }

  // ----------------------------------------------------
  // 3. [Class 2] 피부염/발적
  // ----------------------------------------------------
  if (currentStepId === "C2_Q1") {
    if (answerIndex === 0) return toCommon("점막피부 분리");
    else return createQuestion("C2_Q2");
  }

  if (currentStepId === "C2_Q2") {
    if (answerIndex === 0) return createQuestion("C2_Q2_SUB");
    else return createQuestion("C2_Q3");
  }

  if (currentStepId === "C2_Q2_SUB") {
    if (answerIndex === 0) return toCommon("단순 타박상");
    else return toCommon("외상성 궤양");
  }

  if (currentStepId === "C2_Q3") {
    if (answerIndex === 0) return toCommon("짓무름");
    else if (answerIndex === 1) return toCommon("붉은 흉터");
    else return createQuestion("C2_Q4");
  }

  if (currentStepId === "C2_Q4") {
    if (answerIndex === 0) return toCommon("요산 결정");
    else if (answerIndex === 1) return toCommon("건선");
    else if (answerIndex === 2) return toCommon("육아종");
    else if (answerIndex === 3) return toCommon("곰팡이 감염");
    else if (answerIndex === 4) return toCommon("알레르기");
    else if (answerIndex === 5) return toCommon("기성 사마귀 병변");
    else return createQuestion("C2_Q5");
  }

  if (currentStepId === "C2_Q5") {
    let cause = "";
    if (answerIndex === 0) cause = "자극성 피부염";
    else if (answerIndex === 1) cause = "기계적 손상";
    else if (answerIndex === 2) cause = "모낭염";
    else {
      // 상세 불명 -> SACS 생략하고 바로 병원 권유
      return toCommon("상세 불명의 발적");
    }

    // SACS 질문으로 이동하며 temp_diagnosis에 원인 저장
    return createQuestion("C2_SACS", cause);
  }

  if (currentStepId === "C2_SACS") {
    let sacsScore = "";
    if (answerIndex === 0) sacsScore = "[L1]";
    else if (answerIndex === 1) sacsScore = "[L2]";
    else if (answerIndex === 2) sacsScore = "[L3]";

    const combinedDiag = `${savedDiagnosis} ${sacsScore}`;
    return toCommon(combinedDiag);
  }

  // ----------------------------------------------------
  // 4. [Class 3] 혈류 및 변색 (★재촬영 로직 포함)
  // ----------------------------------------------------
  if (currentStepId === "C3_Q1") {
    // 0번(그림자), 1번(굳은 피) -> 재촬영 및 사진 삭제 요청
    if (answerIndex === 0) return retryResult("단순 그림자입니다. 조명을 확인하고 다시 촬영해주세요.");
    else if (answerIndex === 1) return retryResult("굳은 피(출혈)입니다. 피를 닦아낸 후 다시 촬영해주세요.");
    else if (answerIndex === 2) return toCommon("대장흑색증");
    else if (answerIndex === 3) return toCommon("흉터/색소침착");
    else return createQuestion("C3_Q2");
  }

  if (currentStepId === "C3_Q2") {
    if (answerIndex === 0) return createQuestion("C3_Q2_SUB");
    else return createQuestion("C3_Q3");
  }

  if (currentStepId === "C3_Q2_SUB") {
    if (answerIndex === 0) return toCommon("단순 타박상 (진한 멍)");
    else if (answerIndex === 1) return toCommon("괴저성 농피증");
    else return toCommon("괴사");
  }

  if (currentStepId === "C3_Q3") {
    if (answerIndex === 0) return toCommon("장루 정맥류");
    else if (answerIndex === 1) return toCommon("괴저성 농피증");
    else if (answerIndex === 2) return toCommon("괴사");
    else return createQuestion("C2_Q1"); // 해당 없음 -> C2 문진으로 이동
  }

  // ----------------------------------------------------
  // 5. [공통] 구조적 이상 체크 (★다중 진단 병합)
  // ----------------------------------------------------
  if (currentStepId === "COMMON_Q1") {
    let structureDiag = "";
    if (answerIndex === 0) structureDiag = "장루 탈출";
    else if (answerIndex === 1) structureDiag = "장루 함몰";
    else if (answerIndex === 2) structureDiag = "장루 탈장";
    // answerIndex === 3: 평소와 같음 -> 추가 진단 없음

    let finalText: string;
    if (structureDiag) {
      if (savedDiagnosis === "정상") {
        finalText = structureDiag;
      } else {
        finalText = `${savedDiagnosis}, ${structureDiag}`;
      }
    } else {
      finalText = savedDiagnosis;
    }

    return finalResult(finalText);
  }

  // 기본값: 알 수 없는 오류
  return finalResult("알 수 없는 오류");
}

// ==========================================
// 유틸리티 함수
// ==========================================

/**
 * 응급 문진 시작
 */
export function startEmergencyQuestionnaire(): Question {
  return createQuestion("E_Q1");
}

/**
 * 위험도 문자열 변환
 */
export function getRiskLevelString(level: RiskLevel): "low" | "medium" | "high" {
  switch (level) {
    case 0:
      return "low";
    case 1:
      return "medium";
    case 2:
      return "high";
    default:
      return "low";
  }
}

/**
 * 위험도 숫자를 한글로 변환
 */
export function getRiskLevelLabel(level: RiskLevel): string {
  switch (level) {
    case 0:
      return "정상";
    case 1:
      return "주의";
    case 2:
      return "위험";
    default:
      return "정상";
  }
}
