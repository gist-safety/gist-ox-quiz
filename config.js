// ===== 퀴즈 설정 (메모장으로 열어서 숫자나 글자만 바꾸면 됩니다) =====
// 문제는 엑셀 'OX문제 선별.xlsx'의 기본/응용/도전 문항에서 출제됩니다.
window.QUIZ_CONFIG = {
  // 단계별로 낼 문제 수 (기본 → 응용 → 도전 순서로 출제)
  BASIC_COUNT: 1,
  APPLIED_COUNT: 1,
  CHALLENGE_COUNT: 1,

  // 맞힌 개수별 상품 (사진은 assets 폴더). 조사(을/를)까지 함께 적어 주세요.
  PRIZES: {
    3: { medal: '🥇', rank: '1등', ko: '지니어스 인형', koObj: '지니어스 인형을', en: 'GIST Genius Plush Doll', img: 'assets/prize1.jpg' },
    2: { medal: '🥈', rank: '2등', ko: '충전식 자전거 후미등', koObj: '충전식 자전거 후미등을', en: 'Rechargeable Bike Tail Light', img: 'assets/prize2.jpg' },
    1: { medal: '🥉', rank: '3등', ko: '기념 볼펜', koObj: '기념 볼펜을', en: 'Souvenir Pen', img: 'assets/prize3.jpg' },
  },

  // 학(사)번 입력 칸 사용 여부 (false면 언어 선택 후 바로 문제 시작)
  ASK_ID: true,

  // 학(사)번 최소/최대 자릿수
  ID_MIN_LENGTH: 4,
  ID_MAX_LENGTH: 10,

  // 아무 조작이 없으면 처음 화면으로 돌아가는 시간(초)
  IDLE_SECONDS: 90,

  // 결과 화면에서 자동으로 처음 화면으로 돌아가는 시간(초)
  RESULT_SECONDS: 30,

  // 정답/오답 효과음
  SOUND: true,

  // 배경음악 사용 여부와 음량(0~1). 처음 화면의 ♪ 버튼으로 켜고 끌 수도 있음
  BGM: true,
  BGM_VOLUME: 0.8,
};
