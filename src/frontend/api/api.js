import axios from "axios";

const API_BASE = "http://localhost:8080/api/interview";

// 기본 질문 데이터 (백엔드가 없을 때 사용)
export const mockQuestions = {
  // IT/기술직
  developer: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "프로그래밍을 시작하게 된 계기는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "가장 자신 있는 프로그래밍 언어는 무엇이고, 그 이유는 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "코드 리뷰의 중요성에 대해 어떻게 생각하시나요?", difficulty: "easy" },
    { id: 5, question: "버전 관리 시스템(Git)을 사용하는 이유는 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "개발 환경 설정 시 주의해야 할 점은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "디버깅을 할 때 어떤 방법을 주로 사용하시나요?", difficulty: "easy" },
    { id: 8, question: "함수와 메서드의 차이점을 설명해주세요.", difficulty: "easy" },
    { id: 9, question: "변수와 상수의 차이점은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "프로젝트에서 협업할 때 어떤 도구를 사용하시나요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "Spring에서 DI(Dependency Injection)란 무엇인가요?", difficulty: "medium" },
    { id: 12, question: "RESTful API 설계 원칙에 대해 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "데이터베이스 정규화의 목적과 1NF, 2NF, 3NF에 대해 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "Git 브랜치 전략(Git Flow, GitHub Flow)에 대해 설명해주세요.", difficulty: "medium" },
    { id: 15, question: "JVM의 메모리 구조에 대해 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "동기와 비동기 처리의 차이점과 각각의 사용 사례를 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "API 보안을 위해 어떤 방법들을 사용하시나요?", difficulty: "medium" },
    { id: 18, question: "트랜잭션(Transaction)의 ACID 속성에 대해 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "캐싱 전략을 수립할 때 고려해야 할 사항은 무엇인가요?", difficulty: "medium" },
    { id: 20, question: "로깅(Logging)과 모니터링을 구현할 때 주의사항은 무엇인가요?", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "동시성 프로그래밍에서 발생할 수 있는 문제점과 해결방법을 말씀해주세요.", difficulty: "hard" },
    { id: 22, question: "마이크로서비스 아키텍처의 장단점에 대해 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "분산 시스템에서 CAP 이론을 어떻게 이해하고 적용하시나요?", difficulty: "hard" },
    { id: 24, question: "대용량 트래픽 처리를 위한 시스템 설계 방법을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "데이터베이스 성능 최적화를 위한 인덱싱 전략을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "메시지 큐를 활용한 비동기 처리 아키텍처를 설계한다면 어떻게 하시겠나요?", difficulty: "hard" },
    { id: 27, question: "서비스 장애 발생 시 복구 전략과 예방 방법을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "데이터 일관성을 보장하기 위한 분산 트랜잭션 처리 방법을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "시스템 확장성(Scalability)을 고려한 아키텍처 설계 원칙은 무엇인가요?", difficulty: "hard" },
    { id: 30, question: "컨테이너 오케스트레이션 환경에서 서비스 디스커버리와 로드 밸런싱을 어떻게 구현하시나요?", difficulty: "hard" }
  ],
  designer: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "디자이너가 되고 싶은 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "좋아하는 디자인 스타일이나 디자이너가 있나요?", difficulty: "easy" },
    { id: 4, question: "Figma와 Sketch의 차이점과 각각의 장단점을 설명해주세요.", difficulty: "easy" },
    { id: 5, question: "반응형 웹 디자인에서 모바일 퍼스트 접근법의 장점은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "UI와 UX의 차이점을 설명해주세요.", difficulty: "easy" },
    { id: 7, question: "디자인 작업 시 가장 중요하게 생각하는 요소는 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "색상 선택 시 고려해야 할 사항은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "타이포그래피(Typography)에서 중요한 점은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "그리드 시스템(Grid System)이 왜 중요한가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "디자인 시스템(Design System) 구축 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 12, question: "접근성(Accessibility)을 고려한 디자인 방법에 대해 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "사용자 리서치 방법 중 A/B 테스트와 사용성 테스트의 차이점은 무엇인가요?", difficulty: "medium" },
    { id: 14, question: "디자인 토큰(Design Token)이란 무엇이고, 왜 사용하나요?", difficulty: "medium" },
    { id: 15, question: "프로토타이핑 도구 중 어떤 것을 선호하시고 그 이유는 무엇인가요?", difficulty: "medium" },
    { id: 16, question: "디자인 심리학을 프로젝트에 어떻게 적용하시나요?", difficulty: "medium" },
    { id: 17, question: "크로스 플랫폼 디자인 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 18, question: "마이크로 인터랙션(Micro-interaction) 설계 시 주의사항은 무엇인가요?", difficulty: "medium" },
    { id: 19, question: "디자인 작업의 우선순위를 어떻게 결정하시나요?", difficulty: "medium" },
    { id: 20, question: "개발자와 협업할 때 어떤 문서나 도구를 사용하시나요?", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "디자인 사고(Design Thinking) 프로세스를 실제 프로젝트에 어떻게 적용하시나요?", difficulty: "hard" },
    { id: 22, question: "복잡한 정보를 사용자에게 직관적으로 전달하는 디자인 전략은 무엇인가요?", difficulty: "hard" },
    { id: 23, question: "다크 모드와 라이트 모드를 지원하는 디자인 시스템을 설계한다면 어떻게 하시겠나요?", difficulty: "hard" },
    { id: 24, question: "글로벌 서비스를 위한 다국어 디자인 전략을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "데이터 시각화를 통한 복잡한 정보 전달 방법을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "디자인 팀의 워크플로우를 최적화하는 방법은 무엇인가요?", difficulty: "hard" },
    { id: 27, question: "사용자 피드백을 디자인 개선에 반영하는 프로세스를 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "브랜드 아이덴티티와 일관성을 유지하면서 혁신적인 디자인을 만드는 방법은 무엇인가요?", difficulty: "hard" },
    { id: 29, question: "대규모 조직에서 디자인 시스템을 도입하고 확산시키는 전략을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "AI 도구를 활용한 디자인 워크플로우 개선 방안을 제시해주세요.", difficulty: "hard" }
  ],
  "data-scientist": [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "데이터 사이언티스트가 되고 싶은 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "Python과 R의 장단점을 비교하고, 언제 어떤 언어를 사용하시나요?", difficulty: "easy" },
    { id: 4, question: "가장 흥미로운 데이터 분석 프로젝트 경험이 있나요?", difficulty: "easy" },
    { id: 5, question: "데이터 시각화 도구 중 어떤 것을 사용해보셨나요?", difficulty: "easy" },
    { id: 6, question: "데이터 분석 프로세스의 일반적인 단계는 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "데이터 클리닝(Data Cleaning)이 왜 중요한가요?", difficulty: "easy" },
    { id: 8, question: "머신러닝과 딥러닝의 차이점을 설명해주세요.", difficulty: "easy" },
    { id: 9, question: "데이터 수집 시 주의해야 할 점은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "데이터 분석 결과를 비전문가에게 전달할 때 주의사항은 무엇인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "과적합(Overfitting)이란 무엇이고, 이를 방지하는 방법은 무엇인가요?", difficulty: "medium" },
    { id: 12, question: "교차 검증(Cross Validation)의 종류와 각각의 특징을 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "Feature Engineering에서 중요한 기법들을 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "클러스터링 알고리즘 중 K-means와 DBSCAN의 차이점은 무엇인가요?", difficulty: "medium" },
    { id: 15, question: "A/B 테스트 설계 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 16, question: "정확도(Accuracy)와 정밀도(Precision), 재현율(Recall)의 차이를 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "차원의 저주(Curse of Dimensionality)란 무엇이고 어떻게 해결하나요?", difficulty: "medium" },
    { id: 18, question: "앙상블 학습(Ensemble Learning)의 원리와 종류를 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "하이퍼파라미터 튜닝 전략을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "데이터 전처리 파이프라인을 구축할 때 고려사항은 무엇인가요?", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "시계열 데이터 분석에서 주의해야 할 점은 무엇인가요?", difficulty: "hard" },
    { id: 22, question: "불균형 데이터셋(Imbalanced Dataset)을 처리하는 방법을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "실시간 스트리밍 데이터를 처리하는 아키텍처를 설계한다면 어떻게 하시겠나요?", difficulty: "hard" },
    { id: 24, question: "추천 시스템의 콜드 스타트 문제를 해결하는 방법을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "대규모 데이터셋에서 모델 학습 시간을 단축하는 방법은 무엇인가요?", difficulty: "hard" },
    { id: 26, question: "모델 해석가능성(Interpretability)과 성능 사이의 트레이드오프를 어떻게 관리하시나요?", difficulty: "hard" },
    { id: 27, question: "딥러닝 모델의 학습 안정성을 높이는 기법들을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "프로덕션 환경에서 모델 모니터링 및 재학습 전략을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "전이 학습(Transfer Learning)을 활용한 모델 최적화 방법을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "강화학습을 비즈니스 문제에 적용하는 방법과 주의사항을 설명해주세요.", difficulty: "hard" }
  ],
  "product-manager": [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "프로덕트 매니저가 되고 싶은 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "좋아하는 제품이나 서비스가 있나요? 그 이유는 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "OKR과 KPI의 차이점과 각각의 활용 방법을 설명해주세요.", difficulty: "easy" },
    { id: 5, question: "사용자 스토리(User Story) 작성 시 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "프로덕트 매니저의 주요 역할은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "사용자 피드백을 수집하는 방법은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "제품 기획 시 가장 먼저 고려해야 할 사항은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "애자일 개발 방법론에서 프로덕트 매니저의 역할은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "우선순위를 결정할 때 어떤 기준을 사용하시나요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "제품 로드맵 수립 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 12, question: "MVP(Minimum Viable Product) 정의와 검증 방법에 대해 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "프로덕트-마케팅 핏(Product-Market Fit)을 어떻게 측정하시나요?", difficulty: "medium" },
    { id: 14, question: "고객 여정 맵(Customer Journey Map) 작성 과정을 설명해주세요.", difficulty: "medium" },
    { id: 15, question: "데이터 기반 의사결정을 위한 주요 지표는 무엇인가요?", difficulty: "medium" },
    { id: 16, question: "A/B 테스트를 통한 기능 검증 프로세스를 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "사용자 인터뷰를 진행할 때 주의사항은 무엇인가요?", difficulty: "medium" },
    { id: 18, question: "경쟁사 분석을 수행하는 방법을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "제품 출시 전 체크리스트를 어떻게 구성하시나요?", difficulty: "medium" },
    { id: 20, question: "스프린트 계획에서 기능 우선순위를 조정하는 기준은 무엇인가요?", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "경쟁 제품 분석을 통한 차별화 전략 수립 방법을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "제품의 가치 제안(Value Proposition)을 정의하고 검증하는 과정을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "다양한 이해관계자(Stakeholder)의 요구사항을 조율하는 방법은 무엇인가요?", difficulty: "hard" },
    { id: 24, question: "복잡한 기술 부채와 신규 기능 개발 사이의 균형을 어떻게 맞추시나요?", difficulty: "hard" },
    { id: 25, question: "대규모 조직에서 제품 전략을 수립하고 실행하는 방법을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "글로벌 제품을 현지화할 때 고려해야 할 사항은 무엇인가요?", difficulty: "hard" },
    { id: 27, question: "프로덕트 메트릭을 통해 팀 성과를 측정하고 개선하는 방법을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "제품의 생명주기(Lifecycle) 관리 전략을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "데이터와 직관 사이의 갈등을 해결하는 방법은 무엇인가요?", difficulty: "hard" },
    { id: 30, question: "플랫폼 전략 수립 시 다면 시장(Two-sided Market)을 어떻게 고려하시나요?", difficulty: "hard" }
  ],
  planner: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "기획자가 되고 싶은 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "애자일(Agile) 방법론과 워터폴(Waterfall) 방법론의 차이점은 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "기능 명세서 작성 시 포함해야 할 핵심 요소는 무엇인가요?", difficulty: "easy" },
    { id: 5, question: "프로토타이핑 도구 중 어떤 것을 사용하시고 그 이유는 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "기획서를 작성할 때 가장 중요하게 생각하는 것은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "사용자 요구사항을 수집하는 방법은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "프로젝트 일정을 수립할 때 고려사항은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "기능 우선순위를 결정하는 기준은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "개발팀과 소통할 때 주의사항은 무엇인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "스프린트 계획 수립 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 12, question: "사용자 스토리 맵핑(User Story Mapping) 과정을 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "프로젝트 리스크 관리 방법에 대해 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "스테이크홀더(Stakeholder) 관리 전략은 무엇인가요?", difficulty: "medium" },
    { id: 15, question: "우선순위 결정을 위한 방법론을 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "프로젝트 일정 지연 시 대응 방법을 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "기능 변경 요청을 처리하는 프로세스를 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "효과적인 회의를 진행하는 방법은 무엇인가요?", difficulty: "medium" },
    { id: 19, question: "프로젝트 문서화 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 20, question: "테스트 계획 수립 시 고려사항은 무엇인가요?", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "복잡한 프로젝트의 범위 관리와 변경 요청 처리 방법을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "크로스 펑셔널 팀과의 협업에서 발생하는 갈등을 해결하는 방법은 무엇인가요?", difficulty: "hard" },
    { id: 23, question: "데이터 기반으로 제품 우선순위를 결정하는 프레임워크를 설계한다면 어떻게 하시겠나요?", difficulty: "hard" },
    { id: 24, question: "대규모 프로젝트를 여러 스프린트로 분할하는 전략을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "외부 벤더와 협업할 때의 계약 및 일정 관리 방법을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "프로젝트 실패 시 원인 분석 및 개선 방안 수립 방법을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "조직 내 정치적 상황을 고려한 프로젝트 추진 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "글로벌 팀과의 협업 시 타임존 및 문화적 차이를 어떻게 관리하시나요?", difficulty: "hard" },
    { id: 29, question: "기술 부채를 프로젝트 일정에 반영하는 방법을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "프로젝트 포트폴리오 관리 및 리소스 최적화 전략을 설명해주세요.", difficulty: "hard" }
  ],
  marketer: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "마케터가 되고 싶은 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "좋아하는 마케팅 캠페인이나 브랜드가 있나요?", difficulty: "easy" },
    { id: 4, question: "GA4(Google Analytics 4)와 UA(Universal Analytics)의 주요 차이점은 무엇인가요?", difficulty: "easy" },
    { id: 5, question: "SEO와 SEM의 차이점과 각각의 활용 전략은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "마케팅의 4P 전략에 대해 설명해주세요.", difficulty: "easy" },
    { id: 7, question: "타겟 고객을 정의하는 방법은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "소셜 미디어 마케팅의 장단점은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "콘텐츠 마케팅이 중요한 이유는 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "마케팅 캠페인 성과를 측정하는 기본 지표는 무엇인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "퍼널 분석(Funnel Analysis)을 통한 전환율 개선 방법을 설명해주세요.", difficulty: "medium" },
    { id: 12, question: "고객 생애 가치(LTV) 계산 방법과 이를 활용한 마케팅 전략은 무엇인가요?", difficulty: "medium" },
    { id: 13, question: "리타겟팅(Retargeting) 캠페인 설계 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 14, question: "마케팅 자동화 도구 활용 시 주의사항은 무엇인가요?", difficulty: "medium" },
    { id: 15, question: "브랜드 인지도 측정 방법과 개선 전략을 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "이메일 마케팅 캠페인을 설계할 때 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 17, question: "마케팅 예산 배분 전략을 수립하는 방법을 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "고객 여정(Customer Journey)에 따른 마케팅 메시지 전략을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "경쟁사 마케팅 전략 분석 방법을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "마케팅 데이터 분석 도구 활용 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "멀티채널 마케팅 전략 수립 시 각 채널의 역할과 통합 방법을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "고객 세그멘테이션을 통한 개인화 마케팅 전략 수립 방법을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "마케팅 ROI 측정 및 최적화를 위한 데이터 분석 방법론을 설명해주세요.", difficulty: "hard" },
    { id: 24, question: "어트리뷰션 모델링(Attribution Modeling)을 통한 채널 기여도 분석 방법을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "글로벌 마케팅 전략 수립 시 현지화 전략을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "위기 관리 상황에서 브랜드 평판 회복 전략을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "마케팅 기술 스택(Martech Stack) 구축 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "고객 데이터 플랫폼(CDP)을 활용한 마케팅 최적화 방법을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "프라이버시 규정 준수와 마케팅 개인화 사이의 균형을 어떻게 맞추시나요?", difficulty: "hard" },
    { id: 30, question: "AI 기반 마케팅 도구를 활용한 캠페인 최적화 전략을 설명해주세요.", difficulty: "hard" }
  ],

  // 일반 사무직
  sales: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "영업직에 지원한 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "영업에서 가장 중요한 자질은 무엇이라고 생각하시나요?", difficulty: "easy" },
    { id: 4, question: "고객과의 첫 만남에서 가장 중요하게 생각하는 것은 무엇인가요?", difficulty: "easy" },
    { id: 5, question: "영업 성과 측정을 위한 KPI 설정 기준은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "영업 전화를 할 때 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "고객의 니즈를 파악하는 방법은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "영업 프레젠테이션 준비 시 고려사항은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "거절당했을 때 어떻게 대응하시나요?", difficulty: "easy" },
    { id: 10, question: "영업 성공 사례 중 가장 기억에 남는 것은 무엇인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "SPIN 영업 기법에 대해 설명하고, 실제 적용 경험이 있나요?", difficulty: "medium" },
    { id: 12, question: "CRM 시스템을 활용한 고객 관리 전략을 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "영업 파이프라인 관리에서 중요한 지표는 무엇인가요?", difficulty: "medium" },
    { id: 14, question: "고객 세분화를 통한 타겟 마케팅 전략을 설명해주세요.", difficulty: "medium" },
    { id: 15, question: "가격 협상 시 사용하는 전략과 기법은 무엇인가요?", difficulty: "medium" },
    { id: 16, question: "영업 팀 관리를 위한 동기부여 방법을 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "장기 거래를 위한 관계 구축 전략을 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "영업 계약서 작성 시 주의사항은 무엇인가요?", difficulty: "medium" },
    { id: 19, question: "경쟁사 대비 우리 제품의 강점을 어필하는 방법은 무엇인가요?", difficulty: "medium" },
    { id: 20, question: "영업 프로세스 개선을 위한 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "신규 고객 발굴 방법과 기존 고객 유지 전략의 차이점은 무엇인가요?", difficulty: "hard" },
    { id: 22, question: "복잡한 B2B 영업에서 여러 이해관계자를 설득하는 방법을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "경쟁사와의 가격 경쟁에서 차별화된 가치를 전달하는 전략은 무엇인가요?", difficulty: "hard" },
    { id: 24, question: "글로벌 영업 전략 수립 시 문화적 차이를 어떻게 고려하시나요?", difficulty: "hard" },
    { id: 25, question: "대규모 계약 협상 시 전략과 전술을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "영업 조직의 성과를 측정하고 개선하는 체계를 설계한다면 어떻게 하시겠나요?", difficulty: "hard" },
    { id: 27, question: "고객 성공(Customer Success)과 영업의 협업 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "데이터 기반 영업 예측 및 수요 분석 방법을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "영업 채널 다각화 전략을 수립하는 방법을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "영업 자동화 도구 도입 시 고려사항과 전략을 설명해주세요.", difficulty: "hard" }
  ],
  hr: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "HR 분야에 관심을 갖게 된 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "인사 담당자로서 가장 중요한 자질은 무엇이라고 생각하시나요?", difficulty: "easy" },
    { id: 4, question: "STAR 면접 기법을 활용한 채용 프로세스를 설명해주세요.", difficulty: "easy" },
    { id: 5, question: "직무 분석(Job Analysis) 과정과 JD 작성 시 고려사항은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "신입사원 온보딩 프로세스를 어떻게 구성하시나요?", difficulty: "easy" },
    { id: 7, question: "면접 진행 시 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "직원 복리후생 제도를 설계할 때 고려사항은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "인사 평가 시 주의해야 할 점은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "HR 업무에서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "360도 피드백 시스템 구축 시 주의사항은 무엇인가요?", difficulty: "medium" },
    { id: 12, question: "성과 관리 시스템(Performance Management) 설계 방법을 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "직원 이직률 감소를 위한 리텐션 전략은 무엇인가요?", difficulty: "medium" },
    { id: 14, question: "다양성과 포용성(D&I) 정책 수립 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 15, question: "HR 분석(People Analytics)을 통한 인사 의사결정 방법을 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "채용 마케팅 전략을 수립하는 방법을 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "임금 체계 설계 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 18, question: "인재 육성 프로그램을 기획하는 방법을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "노사 관계 관리 시 주의사항은 무엇인가요?", difficulty: "medium" },
    { id: 20, question: "HR 정보시스템 도입 시 고려사항은 무엇인가요?", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "조직 문화 변화를 이끌어내는 전략과 실행 방법을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "글로벌 기업에서 현지화된 HR 정책을 수립하는 방법은 무엇인가요?", difficulty: "hard" },
    { id: 23, question: "인재 확보와 유지를 위한 종합적인 전략 수립 방법을 설명해주세요.", difficulty: "hard" },
    { id: 24, question: "M&A 이후 조직 통합을 위한 HR 전략을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "디지털 전환에 따른 직무 재설계 전략을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "HR 데이터를 활용한 예측 분석 모델 구축 방법을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "임원 채용 및 보상 전략을 수립하는 방법을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "조직 재구조화 시 인사 배치 전략을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "HR 벤치마킹 및 외부 기관과의 협업 전략을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "차세대 리더십 개발 프로그램을 설계하는 방법을 설명해주세요.", difficulty: "hard" }
  ],
  finance: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "재무/회계 분야에 관심을 갖게 된 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "재무제표의 주요 구성 요소는 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "재무제표 분석에서 중요한 비율 분석 지표들을 설명해주세요.", difficulty: "easy" },
    { id: 5, question: "예산 편성 시 Zero-Based Budgeting과 Incremental Budgeting의 차이점은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "현금흐름표가 중요한 이유는 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "재무 분석 시 주의해야 할 점은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "손익분기점 분석이란 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "회계 원칙 중 가장 중요하게 생각하는 것은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "재무 보고서 작성 시 고려사항은 무엇인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "DCF(현금흐름할인) 모델을 활용한 기업 가치 평가 방법을 설명해주세요.", difficulty: "medium" },
    { id: 12, question: "리스크 관리에서 VaR(Value at Risk) 계산 방법을 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "자본 구조 최적화를 위한 WACC 계산 과정을 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "IFRS와 K-IFRS의 주요 차이점은 무엇인가요?", difficulty: "medium" },
    { id: 15, question: "재무 모델링 시 주의사항과 검증 방법은 무엇인가요?", difficulty: "medium" },
    { id: 16, question: "투자 의사결정을 위한 분석 방법을 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "자금 조달 전략 수립 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 18, question: "신용 분석 및 채권 관리 방법을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "재무 계획 및 예측 모델링 방법을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "내부회계관리제도 운영 시 주의사항은 무엇인가요?", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "M&A 거래에서 기업 가치 평가와 협상 전략을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "파생상품을 활용한 리스크 헤징 전략을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "글로벌 기업의 환율 리스크 관리 방법을 설명해주세요.", difficulty: "hard" },
    { id: 24, question: "구조화 금융 상품 설계 및 평가 방법을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "기업 가치 극대화를 위한 자본배분 전략을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "프라이빗 이퀴티 투자 분석 및 실사 프로세스를 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "재무 부정행위 탐지 및 예방 시스템 구축 방법을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "복잡한 조세 최적화 전략 수립 시 고려사항은 무엇인가요?", difficulty: "hard" },
    { id: 29, question: "재무 리스크 모델링 및 스트레스 테스트 방법을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "블록체인 기술을 재무 시스템에 적용하는 전략을 설명해주세요.", difficulty: "hard" }
  ],
  admin: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "총무/행정 분야에 관심을 갖게 된 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "총무 업무에서 가장 중요한 부분은 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "사무실 운영 효율성을 높이는 방법은 무엇인가요?", difficulty: "easy" },
    { id: 5, question: "직원들의 업무 환경 개선을 위해 어떤 노력을 하시나요?", difficulty: "easy" },
    { id: 6, question: "문서 관리 시 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "회의실 예약 시스템 운영 방법을 설명해주세요.", difficulty: "easy" },
    { id: 8, question: "우편물 및 택배 관리 시 고려사항은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "사무용품 구매 시 고려사항은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "총무 업무에서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "비용 절감을 위한 아이디어가 있으신가요?", difficulty: "medium" },
    { id: 12, question: "사무실 계약 및 관리 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 13, question: "비품 및 장비 관리 시스템 구축 방법을 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "보안 관리 및 재난 대응 계획 수립 방법을 설명해주세요.", difficulty: "medium" },
    { id: 15, question: "예산 관리 및 집행 프로세스를 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "시설 유지보수 관리 전략을 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "법적 규정 준수를 위한 문서 관리 방법을 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "비상 연락망 구축 및 관리 방법을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "행사 및 세미나 기획 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 20, question: "외부 업체와의 계약 관리 프로세스를 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "다중 사무실 운영 시 통합 관리 전략을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "디지털 전환을 통한 총무 업무 효율화 방안을 제시해주세요.", difficulty: "hard" },
    { id: 23, question: "외주 업체 관리 및 계약 협상 전략을 설명해주세요.", difficulty: "hard" },
    { id: 24, question: "글로벌 기업의 현지 사무실 관리 전략을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "리스크 관리 및 보험 전략 수립 방법을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "시설 통합 관리 시스템(FMIS) 도입 전략을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "지속가능 경영을 위한 총무 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "스마트 오피스 구축 전략을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "총무 예산 최적화 및 ROI 분석 방법을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "M&A 이후 사무실 통합 전략을 설명해주세요.", difficulty: "hard" }
  ],
  "customer-service": [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "고객 서비스 분야에 관심을 갖게 된 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "고객 서비스에서 가장 중요한 것은 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "화가 난 고객을 어떻게 대응하시나요?", difficulty: "easy" },
    { id: 5, question: "고객 만족도를 높이기 위한 방법은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "고객 응대 시 가장 먼저 해야 할 일은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "전화 상담 시 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "고객 불만 접수 시 처리 절차는 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "서비스 품질을 유지하기 위한 방법은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "고객 서비스 업무에서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "어려운 고객 문의를 해결한 경험이 있나요?", difficulty: "medium" },
    { id: 12, question: "고객 이탈 방지를 위한 전략을 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "고객 피드백 수집 및 개선 프로세스를 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "다양한 채널(전화, 이메일, 채팅) 고객 지원 시 주의사항은 무엇인가요?", difficulty: "medium" },
    { id: 15, question: "고객 서비스 팀의 성과 측정 지표는 무엇인가요?", difficulty: "medium" },
    { id: 16, question: "고객 상담 스크립트 작성 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 17, question: "서비스 에스컬레이션 프로세스를 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "고객 교육 및 온보딩 전략을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "고객 서비스 팀 교육 프로그램을 설계하는 방법을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "서비스 품질 모니터링 및 개선 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "고객 여정 최적화를 통한 서비스 개선 전략을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "AI 챗봇과 인간 상담원의 협업 모델을 설계한다면 어떻게 하시겠나요?", difficulty: "hard" },
    { id: 23, question: "글로벌 서비스에서 문화적 차이를 고려한 고객 대응 전략은 무엇인가요?", difficulty: "hard" },
    { id: 24, question: "고객 서비스 센터 운영 최적화 전략을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "다채널 고객 경험 통합 전략을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "고객 데이터 분석을 통한 예측적 서비스 전략을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "서비스 오토메이션 도입 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "고객 성공(Customer Success) 프로그램 설계 방법을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "서비스 리스크 관리 및 위기 대응 전략을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "고객 서비스 혁신을 위한 기술 도입 전략을 설명해주세요.", difficulty: "hard" }
  ],

  // 전문직
  teacher: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "교사가 되고 싶은 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "교육자로서의 철학을 말씀해주세요.", difficulty: "easy" },
    { id: 4, question: "학생들과의 소통 방법에 대해 설명해주세요.", difficulty: "easy" },
    { id: 5, question: "수업 준비 시 가장 중요하게 생각하는 것은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "학생의 집중력을 높이기 위한 방법은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "교실 분위기를 좋게 만드는 방법은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "학생 평가 시 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "교과서 외 학습 자료를 활용하는 방법은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "교사로서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "어려운 학생을 지도한 경험이 있나요?", difficulty: "medium" },
    { id: 12, question: "교육 방법의 혁신을 위해 어떤 노력을 하시나요?", difficulty: "medium" },
    { id: 13, question: "학생들의 학습 동기 유발 방법을 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "학부모와의 소통 및 협력 방법을 설명해주세요.", difficulty: "medium" },
    { id: 15, question: "교실에서의 효과적인 수업 운영 방법을 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "프로젝트 기반 학습을 설계하는 방법을 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "학생 간 협력 학습을 유도하는 방법을 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "교과 융합 수업을 기획하는 방법을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "학생 참여형 수업 운영 방법을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "교육 기술 도구 활용 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "다양한 학습 수준의 학생들을 한 반에서 가르치는 전략은 무엇인가요?", difficulty: "hard" },
    { id: 22, question: "디지털 시대에 맞는 교육 방향과 기술 활용 방법을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "학생 평가 방법의 개선 및 교육과정 설계 전략을 설명해주세요.", difficulty: "hard" },
    { id: 24, question: "개별 맞춤형 교육을 실현하는 방법을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "창의적 사고력을 기르는 수업 설계 방법을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "글로벌 시민 의식 함양을 위한 교육 프로그램을 설계한다면 어떻게 하시겠나요?", difficulty: "hard" },
    { id: 27, question: "교육 빅데이터를 활용한 학습 분석 및 개선 방법을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "학생 정서 및 인성 교육 통합 전략을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "교육 공동체 형성을 위한 협력 방안을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "미래 교육 방향을 고려한 교사 역량 개발 전략을 설명해주세요.", difficulty: "hard" }
  ],
  nurse: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "간호사가 되고 싶은 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "간호사로서 가장 중요한 자질은 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "환자와의 소통 방법에 대해 설명해주세요.", difficulty: "easy" },
    { id: 5, question: "간호 업무에서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    { id: 6, question: "기본 간호 수행 시 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "환자 상태 관찰 시 확인해야 할 사항은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "의료진과 소통할 때 중요한 점은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "환자 안전을 위해 일상적으로 하는 노력은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "간호 기록 작성의 중요성에 대해 어떻게 생각하시나요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "응급상황 대처 경험이 있으신가요?", difficulty: "medium" },
    { id: 12, question: "의료진과의 협업 시 주의사항은 무엇인가요?", difficulty: "medium" },
    { id: 13, question: "환자 안전 관리 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 14, question: "간호 기록 작성 시 주의사항을 설명해주세요.", difficulty: "medium" },
    { id: 15, question: "스트레스 관리 및 업무 균형을 유지하는 방법은 무엇인가요?", difficulty: "medium" },
    { id: 16, question: "약물 투여 시 5 Right 원칙에 대해 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "감염 관리 및 방역 조치 방법을 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "환자 교육 프로그램을 기획하는 방법을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "간호 업무 표준화를 위한 방법을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "의료 기기 사용 및 관리 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "복잡한 의료 사례에서 의사결정을 내리는 과정을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "간호 리더십 및 후배 간호사 교육 방법을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "의료 환경 변화에 대응한 간호 실무 개선 방안을 제시해주세요.", difficulty: "hard" },
    { id: 24, question: "의료 사고 예방 및 위기 대응 체계를 구축한다면 어떻게 하시겠나요?", difficulty: "hard" },
    { id: 25, question: "간호 품질 지표 설정 및 모니터링 방법을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "다학제 간 협업을 통한 환자 중심 케어 모델을 설계한다면 어떻게 하시겠나요?", difficulty: "hard" },
    { id: 27, question: "디지털 헬스케어 기술을 간호 실무에 통합하는 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "간호 연구 및 증거 기반 실무(EBP) 적용 방법을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "간호 업무 재설계를 통한 효율성 향상 방안을 제시해주세요.", difficulty: "hard" },
    { id: 30, question: "글로벌 간호 표준 준수 및 인증 획득 전략을 설명해주세요.", difficulty: "hard" }
  ],
  lawyer: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "변호사가 되고 싶은 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "변호사로서 가장 중요한 역량은 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "법률 상담 시 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 5, question: "법률 분야의 변화에 어떻게 적응하시나요?", difficulty: "easy" },
    { id: 6, question: "법률 문헌 조사 시 주로 사용하는 자료는 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "클라이언트와의 첫 상담 시 준비사항은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "법률 문서를 읽을 때 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "변호사로서 가장 중요하게 생각하는 윤리는 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "법률 업무에서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "어려운 사건을 해결한 경험이 있나요?", difficulty: "medium" },
    { id: 12, question: "법률 문서 작성 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 13, question: "클라이언트와의 신뢰 관계 구축 방법을 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "법률 연구 및 판례 분석 방법을 설명해주세요.", difficulty: "medium" },
    { id: 15, question: "법정에서의 변론 전략을 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "계약서 검토 시 확인해야 할 주요 사항은 무엇인가요?", difficulty: "medium" },
    { id: 17, question: "소송 전략 수립 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 18, question: "법률 자문 제공 시 주의사항은 무엇인가요?", difficulty: "medium" },
    { id: 19, question: "타협 및 조정 절차 진행 방법을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "법률 업무의 시간 관리 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "복잡한 다각도 분쟁 해결 전략을 수립하는 방법을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "국제 법률 분쟁에서의 대응 전략을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "변호사 윤리와 이해상충 상황 처리 방법을 설명해주세요.", difficulty: "hard" },
    { id: 24, question: "M&A 거래에서의 법률 검토 및 실사 프로세스를 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "규제 법률 및 정책 분석 방법을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "대규모 집단 소송 관리 전략을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "법률 기술(Legal Tech) 도구 활용 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "국제 중재 절차에서의 전략 수립 방법을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "법률 팀 관리 및 업무 분배 전략을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "법률 리스크 관리 및 예방 전략을 설명해주세요.", difficulty: "hard" }
  ],
  accountant: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "회계사가 되고 싶은 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "회계사로서 가장 중요한 자질은 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "세무 신고 과정에 대해 설명해주세요.", difficulty: "easy" },
    { id: 5, question: "회계 기준 변경에 어떻게 대응하시나요?", difficulty: "easy" },
    { id: 6, question: "재무제표 작성 시 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "회계 증빙 자료 관리 방법을 설명해주세요.", difficulty: "easy" },
    { id: 8, question: "월별 결산 작업 시 확인사항은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "세무 신고 시 가장 주의해야 할 점은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "회계 업무에서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "회계 시스템 구축 경험이 있으신가요?", difficulty: "medium" },
    { id: 12, question: "재무제표 분석 및 감사 프로세스를 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "세무 전략 수립 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 14, question: "내부회계관리제도 구축 방법을 설명해주세요.", difficulty: "medium" },
    { id: 15, question: "세무 조사 대응 전략을 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "연결재무제표 작성 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 17, question: "세무 전략 수립을 위한 세법 분석 방법을 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "회계 감사 시 감사위험 평가 방법을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "세무 신고 자동화 시스템 구축 방법을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "회계 부정 탐지 및 예방 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "M&A 거래에서의 회계 및 세무 이슈 처리 방법을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "국제회계기준(IFRS) 전환 프로세스를 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "복잡한 세무 구조 최적화 전략을 수립하는 방법을 설명해주세요.", difficulty: "hard" },
    { id: 24, question: "글로벌 기업의 이전가격(Transfer Pricing) 관리 전략을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "회계 추정 및 가정 변경 시 재무제표 영향 분석 방법을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "파생상품 회계 처리 및 헤지 회계 방법을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "재무 리포팅 자동화 및 실시간 보고 체계 구축 방법을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "회계 데이터 분석을 통한 경영 의사결정 지원 방법을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "세무 규제 변화에 대응한 전략 수립 방법을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "블록체인 기술을 회계 시스템에 적용하는 전략을 설명해주세요.", difficulty: "hard" }
  ],

  // 서비스업
  retail: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "유통/판매 분야에 관심을 갖게 된 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "유통업에서 가장 중요한 요소는 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "고객 서비스 개선 방안에 대해 말씀해주세요.", difficulty: "easy" },
    { id: 5, question: "매출 증대를 위한 전략은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "매장에서 고객을 맞이할 때 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "상품 진열 시 고려해야 할 사항은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "고객 불만 처리 시 어떤 절차를 따르시나요?", difficulty: "easy" },
    { id: 9, question: "매장 재고 파악을 위해 어떤 방법을 사용하시나요?", difficulty: "easy" },
    { id: 10, question: "판매 직원으로서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "재고 관리 방법에 대해 설명해주세요.", difficulty: "medium" },
    { id: 12, question: "고객 만족도 향상을 위한 전략을 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "매장 운영 효율성 향상 방법을 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "프로모션 및 이벤트 기획 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 15, question: "온라인과 오프라인 채널 통합 전략을 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "고객 세그멘테이션을 통한 타겟 마케팅 전략을 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "매장 성과 분석을 위한 주요 지표는 무엇인가요?", difficulty: "medium" },
    { id: 18, question: "상품 포트폴리오 최적화 전략을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "고객 리텐션 전략 수립 방법을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "매장 직원 교육 및 관리 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "데이터 기반 상품 기획 및 진열 전략을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "글로벌 공급망 관리 및 물류 최적화 전략을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "디지털 전환을 통한 유통업 혁신 방안을 제시해주세요.", difficulty: "hard" },
    { id: 24, question: "오므니채널 전략 수립 및 실행 방법을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "고객 경험(CX) 최적화를 위한 통합 전략을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "AI 및 빅데이터를 활용한 수요 예측 및 재고 최적화 방법을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "브랜드 포지셔닝 및 차별화 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "글로벌 유통 네트워크 구축 및 현지화 전략을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "지속가능한 유통 모델 설계 방법을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "유통업의 미래 트렌드와 대응 전략을 설명해주세요.", difficulty: "hard" }
  ],
  hospitality: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "호텔/관광 분야에 관심을 갖게 된 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "호텔 서비스에서 가장 중요한 것은 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "고객 불만 처리 경험이 있나요?", difficulty: "easy" },
    { id: 5, question: "관광객 만족도를 높이는 방법은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "체크인/체크아웃 시 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "객실 서비스 제공 시 고려사항은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "호텔 직원으로서 가장 중요하게 생각하는 것은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "고객 요청을 처리할 때의 원칙은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "호텔 업무에서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "시즌별 운영 전략에 대해 설명해주세요.", difficulty: "medium" },
    { id: 12, question: "예약 관리 및 객실 배정 전략을 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "호텔 내 식음료 서비스 운영 방법을 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "이벤트 및 컨퍼런스 기획 시 고려사항은 무엇인가요?", difficulty: "medium" },
    { id: 15, question: "호텔 마케팅 및 브랜딩 전략을 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "수익 관리(Revenue Management) 전략을 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "고객 리텐션 프로그램 설계 방법을 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "호텔 품질 관리 및 서비스 표준화 방법을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "온라인 여행사(OTA)와의 협력 전략을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "호텔 직원 교육 및 성과 관리 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "글로벌 호텔 체인 운영 시 현지화 전략을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "고객 데이터 분석을 통한 개인화 서비스 제공 방법을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "지속가능한 관광 및 친환경 호텔 운영 전략을 설명해주세요.", difficulty: "hard" },
    { id: 24, question: "AI 및 빅데이터를 활용한 수익 최적화 전략을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "호텔 디지털 전환 전략 및 스마트 호텔 구축 방법을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "위기 관리 및 리스크 대응 전략을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "호텔 브랜드 포트폴리오 관리 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "글로벌 관광 트렌드 대응 및 혁신 서비스 개발 방법을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "호텔 M&A 및 프랜차이즈 확장 전략을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "호스피탈리티 산업의 미래와 변화 대응 전략을 설명해주세요.", difficulty: "hard" }
  ],
  "food-service": [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "외식업에 관심을 갖게 된 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "외식업에서 가장 중요한 요소는 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "고객 서비스 개선 방안은 무엇인가요?", difficulty: "easy" },
    { id: 5, question: "비용 절감을 위한 방법은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "음식 주문 접수 시 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "식당에서 고객 응대 시 가장 중요하게 생각하는 것은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "음식 서빙 시 주의해야 할 사항은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "위생 관리에서 가장 중요하게 생각하는 것은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "외식업에서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "메뉴 개발 과정에 대해 설명해주세요.", difficulty: "medium" },
    { id: 12, question: "식자재 관리 및 발주 프로세스를 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "주방 운영 효율성 향상 방법을 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "음식 안전 관리 및 위생 관리 방법을 설명해주세요.", difficulty: "medium" },
    { id: 15, question: "직원 교육 및 관리 방법을 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "메뉴 가격 책정 전략을 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "식당 운영 수익성 분석 방법을 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "고객 만족도 조사 및 개선 프로세스를 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "시즌별 메뉴 기획 및 마케팅 전략을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "식당 리뷰 관리 및 온라인 평판 관리 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "프랜차이즈 운영 시 품질 일관성 유지 전략을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "데이터 기반 메뉴 가격 전략 및 수익성 분석 방법을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "배달 서비스 및 온라인 주문 시스템 통합 전략을 설명해주세요.", difficulty: "hard" },
    { id: 24, question: "다중 매장 운영 시 효율성 향상 및 통합 관리 전략을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "식자재 공급망 최적화 및 리스크 관리 전략을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "외식업 디지털 전환 및 스마트 레스토랑 구축 전략을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "지속가능한 외식업 모델 및 친환경 운영 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "글로벌 외식 브랜드 확장 및 현지화 전략을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "외식업 혁신 기술 도입 및 고객 경험 혁신 방법을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "외식업의 미래 트렌드 대응 및 경쟁력 강화 전략을 설명해주세요.", difficulty: "hard" }
  ],

  // 제조업
  manufacturing: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "제조업에 관심을 갖게 된 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "제조업에서 가장 중요한 요소는 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "안전 관리 시스템에 대해 말씀해주세요.", difficulty: "easy" },
    { id: 5, question: "품질 개선을 위한 노력은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "생산 라인 작업 시 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "제조 공정에서 품질 체크 포인트는 어디인가요?", difficulty: "easy" },
    { id: 8, question: "작업 환경 개선을 위해 어떤 노력을 하시나요?", difficulty: "easy" },
    { id: 9, question: "생산 지표 중 가장 중요하게 생각하는 것은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "제조업에서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "생산 효율성 향상 방법에 대해 설명해주세요.", difficulty: "medium" },
    { id: 12, question: "생산 계획 및 일정 관리 방법을 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "설비 유지보수 및 관리 전략을 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "원자재 관리 및 조달 전략을 설명해주세요.", difficulty: "medium" },
    { id: 15, question: "불량품 관리 및 개선 프로세스를 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "생산 라인 밸런싱 및 효율화 방법을 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "제조 비용 절감 전략을 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "생산 데이터 분석 및 KPI 관리 방법을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "작업자 교육 및 역량 강화 프로그램을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "제조 프로세스 표준화 및 개선 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "스마트 팩토리 및 공장 자동화 전략을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "린(Lean) 제조 및 Six Sigma 방법론 적용 사례를 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "글로벌 공급망 최적화 및 리스크 관리 전략을 설명해주세요.", difficulty: "hard" },
    { id: 24, question: "제조 실행 시스템(MES) 구축 및 통합 전략을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "예측 정비(Predictive Maintenance) 시스템 구축 방법을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "디지털 트윈(Digital Twin) 기술을 제조에 활용하는 전략을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "탄소 중립 및 지속가능한 제조 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "글로벌 제조 네트워크 최적화 및 현지화 전략을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "제조 혁신 기술(3D 프린팅, 로봇 공학 등) 도입 전략을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "제조업의 미래 및 4차 산업혁명 대응 전략을 설명해주세요.", difficulty: "hard" }
  ],
  "quality-control": [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "품질관리 분야에 관심을 갖게 된 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "품질관리에서 가장 중요한 것은 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "품질 기준 설정 과정에 대해 말씀해주세요.", difficulty: "easy" },
    { id: 5, question: "불량품 발생 시 대응 방법은 무엇인가요?", difficulty: "easy" },
    { id: 6, question: "품질 검사 시 확인해야 할 주요 항목은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "품질 기록을 작성할 때 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "품질 기준서를 이해하고 적용하는 방법은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "품질 개선을 위해 일상적으로 하는 노력은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "품질관리 업무에서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "품질 검사 프로세스에 대해 설명해주세요.", difficulty: "medium" },
    { id: 12, question: "품질 관리 시스템 구축 방법을 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "통계적 품질 관리(SQC) 방법을 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "공급업체 품질 관리 전략을 설명해주세요.", difficulty: "medium" },
    { id: 15, question: "품질 개선 프로젝트 관리 방법을 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "품질 데이터 분석 및 트렌드 파악 방법을 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "품질 비용 분석 및 개선 전략을 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "제품 인증 및 규제 준수 관리 방법을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "품질 감사 계획 및 실행 방법을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "품질 팀 관리 및 협업 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "Six Sigma 방법론을 활용한 품질 개선 프로세스를 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "디지털 품질 관리 시스템 구축 및 데이터 분석 방법을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "글로벌 품질 표준 준수 및 인증 획득 전략을 설명해주세요.", difficulty: "hard" },
    { id: 24, question: "품질 예측 분석 및 머신러닝 활용 방법을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "복잡한 공급망에서의 품질 관리 전략을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "품질 문화 구축 및 조직 전반의 품질 개선 전략을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "품질 리스크 관리 및 위기 대응 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "국제 품질 표준(ISO 등) 인증 획득 및 유지 전략을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "품질 혁신 및 신기술 도입 전략을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "글로벌 품질 관리 네트워크 구축 및 표준화 전략을 설명해주세요.", difficulty: "hard" }
  ],
  logistics: [
    // 초급 (easy) - 10개
    { id: 1, question: "자기소개를 해주세요.", difficulty: "easy" },
    { id: 2, question: "물류/운송 분야에 관심을 갖게 된 이유는 무엇인가요?", difficulty: "easy" },
    { id: 3, question: "물류업에서 가장 중요한 요소는 무엇인가요?", difficulty: "easy" },
    { id: 4, question: "고객 만족도를 높이는 방법은 무엇인가요?", difficulty: "easy" },
    { id: 5, question: "배송 최적화 방법에 대해 설명해주세요.", difficulty: "easy" },
    { id: 6, question: "창고에서 물품 입고 시 확인사항은 무엇인가요?", difficulty: "easy" },
    { id: 7, question: "배송 전 물품 포장 시 주의사항은 무엇인가요?", difficulty: "easy" },
    { id: 8, question: "물류 업무에서 가장 중요하게 생각하는 것은 무엇인가요?", difficulty: "easy" },
    { id: 9, question: "배송 지연 발생 시 대응 방법은 무엇인가요?", difficulty: "easy" },
    { id: 10, question: "물류 업무에서 가장 보람을 느끼는 순간은 언제인가요?", difficulty: "easy" },
    
    // 중급 (medium) - 10개
    { id: 11, question: "재고 관리 시스템에 대해 말씀해주세요.", difficulty: "medium" },
    { id: 12, question: "창고 운영 및 관리 전략을 설명해주세요.", difficulty: "medium" },
    { id: 13, question: "운송 경로 최적화 및 배차 관리 방법을 설명해주세요.", difficulty: "medium" },
    { id: 14, question: "물류 비용 절감 전략을 설명해주세요.", difficulty: "medium" },
    { id: 15, question: "물류 정보 시스템(WMS, TMS) 활용 방법을 설명해주세요.", difficulty: "medium" },
    { id: 16, question: "물류 네트워크 설계 및 최적화 방법을 설명해주세요.", difficulty: "medium" },
    { id: 17, question: "물류 성과 지표(KPI) 설정 및 관리 방법을 설명해주세요.", difficulty: "medium" },
    { id: 18, question: "물류 파트너 관리 및 협력 전략을 설명해주세요.", difficulty: "medium" },
    { id: 19, question: "물류 프로세스 표준화 및 개선 방법을 설명해주세요.", difficulty: "medium" },
    { id: 20, question: "물류 서비스 품질 관리 방법을 설명해주세요.", difficulty: "medium" },
    
    // 고급 (hard) - 10개
    { id: 21, question: "글로벌 공급망 관리 및 국제 물류 전략을 설명해주세요.", difficulty: "hard" },
    { id: 22, question: "스마트 물류 및 자동화 시스템 구축 전략을 설명해주세요.", difficulty: "hard" },
    { id: 23, question: "리스크 관리 및 비상 대응 계획 수립 방법을 설명해주세요.", difficulty: "hard" },
    { id: 24, question: "물류 빅데이터 분석 및 AI 활용 전략을 설명해주세요.", difficulty: "hard" },
    { id: 25, question: "지속가능한 물류 및 친환경 물류 전략을 설명해주세요.", difficulty: "hard" },
    { id: 26, question: "물류 디지털 전환 및 블록체인 활용 전략을 설명해주세요.", difficulty: "hard" },
    { id: 27, question: "복잡한 다층 공급망 최적화 전략을 설명해주세요.", difficulty: "hard" },
    { id: 28, question: "물류 혁신 기술(드론, 자율주행 등) 도입 전략을 설명해주세요.", difficulty: "hard" },
    { id: 29, question: "글로벌 물류 네트워크 통합 및 운영 전략을 설명해주세요.", difficulty: "hard" },
    { id: 30, question: "물류업의 미래 및 지능형 물류 시스템 구축 전략을 설명해주세요.", difficulty: "hard" }
  ]
};

// 배열 셔플 함수
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const getQuestions = async (jobType, difficulty = "medium", count = null) => {
  // 백엔드가 없으므로 바로 모의 데이터 사용
  console.log("=== getQuestions 호출 ===");
  console.log("받은 jobType:", jobType);
  console.log("받은 difficulty:", difficulty);
  console.log("받은 count:", count);
  console.log("사용 가능한 직무:", Object.keys(mockQuestions));
  
  // jobType이 없거나 유효하지 않으면 developer로 기본값 설정
  const validJobType = jobType && mockQuestions[jobType] ? jobType : 'developer';
  let questions = mockQuestions[validJobType] || mockQuestions.developer;
  
  // 난이도별 필터링
  if (difficulty && difficulty !== "all") {
    questions = questions.filter(q => q.difficulty === difficulty);
  }
  
  // 질문이 없으면 해당 난이도가 없으므로 전체 질문 반환
  if (questions.length === 0) {
    console.warn(`${difficulty} 난이도 질문이 없어 전체 질문 반환`);
    questions = mockQuestions[validJobType] || mockQuestions.developer;
  }
  
  // 중복 방지: 이전에 본 질문 ID 추적
  const storageKey = `answered_questions_${validJobType}_${difficulty}`;
  const answeredQuestionIds = JSON.parse(localStorage.getItem(storageKey) || "[]");
  
  // 이미 본 질문 제외
  let availableQuestions = questions.filter(q => !answeredQuestionIds.includes(q.id));
  
  // 사용 가능한 질문이 부족하면 리셋 (모든 질문을 다시 사용 가능하게)
  if (availableQuestions.length < (count || 3)) {
    console.log("사용 가능한 질문이 부족하여 리셋합니다.");
    localStorage.removeItem(storageKey);
    availableQuestions = questions;
  }
  
  // 랜덤 셔플
  availableQuestions = shuffleArray(availableQuestions);
  
  // 개수 제한
  if (count && count > 0) {
    availableQuestions = availableQuestions.slice(0, count);
  }
  
  // 선택된 질문 ID 저장
  const selectedIds = availableQuestions.map(q => q.id);
  const updatedAnsweredIds = [...answeredQuestionIds, ...selectedIds];
  localStorage.setItem(storageKey, JSON.stringify(updatedAnsweredIds));
  
  console.log("사용할 직무 타입:", validJobType);
  console.log("필터링된 질문 개수:", availableQuestions?.length);
  console.log("반환할 질문:", availableQuestions);
  
  // 즉시 반환하되 Promise로 감싸서 async/await 호환성 유지
  return Promise.resolve(availableQuestions);
};

// 기업별 질문 생성 API
export const generateCompanyQuestions = async (companyName, jobType, difficulty = "medium", count = 5) => {
  try {
    const API_BASE_MONGODB = process.env.REACT_APP_API_URL || "http://localhost:3001/api";
    console.log('기업별 질문 생성 요청:', { companyName, jobType, difficulty, count });
    
    const res = await axios.post(`${API_BASE_MONGODB}/generate-questions`, {
      companyName,
      jobType,
      difficulty,
      count
    }, {
      timeout: 30000, // 30초 (질문 생성에 시간 필요)
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('생성된 질문 받음:', res.data);
    
    if (res.data.questions && Array.isArray(res.data.questions)) {
      return res.data.questions;
    } else {
      // 응답 형식이 다른 경우 처리
      return Array.isArray(res.data) ? res.data : [];
    }
  } catch (error) {
    console.error("기업별 질문 생성 실패:", error);
    // 오류 시 기본 질문 반환
    return [
      { id: 1, question: `${companyName}에 지원하게 된 이유는 무엇인가요?`, difficulty },
      { id: 2, question: `${companyName}의 비즈니스 모델에 대해 어떻게 이해하고 있나요?`, difficulty },
      { id: 3, question: `${jobType} 직무에서 가장 중요하다고 생각하는 역량은 무엇인가요?`, difficulty }
    ];
  }
};

export const requestFeedback = async (question, answer) => {
  try {
    // 실제 API 호출 시도
    const API_BASE_MONGODB = process.env.REACT_APP_API_URL || "http://localhost:3001/api";
    console.log('피드백 요청:', { question: question.substring(0, 50), answerLength: answer.length });
    
    const res = await axios.post(`${API_BASE_MONGODB}/feedback`, { 
      question, 
      answer 
    }, {
      timeout: 15000, // 15초로 증가 (AI 분석에 시간 필요)
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('피드백 응답 받음:', res.data);
    
    // 구조화된 데이터 반환 (하위 호환성 유지)
    if (res.data.score !== undefined && res.data.evaluation) {
      return {
        feedback: res.data.feedback || "",
        score: res.data.score || 50,
        evaluation: res.data.evaluation || {
          completeness: 50,
          relevance: 50,
          clarity: 50,
          detail: 50
        }
      };
    } else {
      // 이전 형식 (텍스트만)인 경우 변환
      return {
        feedback: res.data.feedback || res.data || "",
        score: 50,
        evaluation: {
          completeness: 50,
          relevance: 50,
          clarity: 50,
          detail: 50
        }
      };
    }
  } catch (error) {
    // 타임아웃이거나 네트워크 오류 시 빠르게 모의 피드백 반환
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      console.warn("피드백 API 타임아웃, 모의 피드백 생성");
    } else {
      console.warn("피드백 API 호출 실패, 모의 피드백 생성:", error.message);
    }
    // API 호출 실패 시 즉시 모의 피드백 생성 (블로킹 최소화)
    return generateMockFeedback(question, answer);
  }
};

// 모의 피드백 생성 함수
const generateMockFeedback = (question, answer) => {
  const answerLength = answer ? answer.length : 0;
  const hasKeywords = checkKeywords(answer);
  
  let feedback = "답변을 잘 들어주셨습니다. ";
  let completeness = 70;
  let relevance = 70;
  let clarity = 70;
  let detail = 60;
  
  if (answerLength < 50) {
    feedback += "답변이 다소 짧습니다. 구체적인 예시나 경험을 추가하면 더 좋을 것 같습니다. ";
    completeness = 50;
    detail = 40;
  } else if (answerLength > 200) {
    feedback += "상세한 답변을 해주셨네요. 핵심 내용을 더 명확하게 정리하면 좋겠습니다. ";
    completeness = 85;
    detail = 80;
    clarity = 75;
  } else {
    feedback += "적절한 길이의 답변을 해주셨습니다. ";
    completeness = 75;
    detail = 65;
  }
  
  if (hasKeywords) {
    feedback += "관련 키워드를 잘 활용하셨습니다. ";
    detail += 10;
    relevance += 5;
  }
  
  feedback += "실제 경험을 바탕으로 한 구체적인 사례를 더 포함하면 면접관에게 더 좋은 인상을 줄 수 있을 것입니다.";
  
  const score = Math.round((completeness + relevance + clarity + detail) / 4);
  
  return {
    feedback,
    score: Math.min(100, score),
    evaluation: {
      completeness: Math.min(100, completeness),
      relevance: Math.min(100, relevance),
      clarity: Math.min(100, clarity),
      detail: Math.min(100, detail)
    }
  };
};

// 키워드 체크 함수
const checkKeywords = (answer) => {
  const keywords = [
    "경험", "프로젝트", "학습", "문제", "해결", "개선", "성과", "성장",
    "팀워크", "소통", "도전", "목표", "계획", "분석", "결과", "효과"
  ];
  
  return keywords.some(keyword => answer.includes(keyword));
};

// ==================== MongoDB API 함수들 ====================
// 백엔드 API 엔드포인트 (MongoDB와 연동됨)
const API_BASE_MONGODB = process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// axios 인스턴스 생성 (토큰 자동 포함)
const apiClient = axios.create({
  baseURL: API_BASE_MONGODB,
});

// 요청 인터셉터: 모든 요청에 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 사용자 관련 API
export const userAPI = {
  // 회원가입
  signup: async (email, password, name) => {
    try {
      // 회원가입과 로그인은 토큰이 없어도 되므로 axios 직접 사용
      const res = await axios.post(`${API_BASE_MONGODB}/auth/signup`, {
        email,
        password,
        name
      });
      return res.data;
    } catch (error) {
      console.error("회원가입 실패:", error);
      throw error;
    }
  },

  // 로그인
  login: async (email, password) => {
    try {
      // 회원가입과 로그인은 토큰이 없어도 되므로 axios 직접 사용
      const res = await axios.post(`${API_BASE_MONGODB}/auth/login`, {
        email,
        password
      });
      return res.data;
    } catch (error) {
      console.error("로그인 실패:", error);
      throw error;
    }
  },

  // 사용자 정보 업데이트
  updateUser: async (userId, updates) => {
    try {
      const res = await apiClient.put(`/users/${userId}`, updates);
      return res.data;
    } catch (error) {
      console.error("사용자 정보 업데이트 실패:", error);
      throw error;
    }
  },

  // 사용자 정보 조회
  getUser: async (userId) => {
    try {
      const res = await apiClient.get(`/users/${userId}`);
      return res.data;
    } catch (error) {
      console.error("사용자 정보 조회 실패:", error);
      throw error;
    }
  }
};

// 면접 기록 관련 API
export const interviewAPI = {
  // 면접 기록 저장
  saveInterview: async (interviewData) => {
    try {
      const res = await apiClient.post(`/interviews`, interviewData);
      return res.data;
    } catch (error) {
      console.error("면접 기록 저장 실패:", error);
      throw error;
    }
  },

  // 사용자의 면접 기록 조회
  getUserInterviews: async (userId) => {
    try {
      const res = await apiClient.get(`/interviews/user/${userId}`);
      return res.data;
    } catch (error) {
      // 네트워크 에러는 조용하게 처리 (로컬 스토리지로 폴백)
      const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
      if (!isNetworkError && process.env.NODE_ENV === 'development') {
        console.warn("면접 기록 조회 실패:", error.message);
      }
      throw error;
    }
  },

  // 특정 면접 기록 조회
  getInterview: async (interviewId) => {
    try {
      const res = await apiClient.get(`/interviews/${interviewId}`);
      return res.data;
    } catch (error) {
      // 네트워크 에러는 조용하게 처리 (로컬 스토리지로 폴백)
      const isNetworkError = error.code === 'ERR_NETWORK' || error.message === 'Network Error';
      if (!isNetworkError && process.env.NODE_ENV === 'development') {
        console.warn("면접 기록 조회 실패:", error.message);
      }
      throw error;
    }
  },

  // 면접 기록 삭제
  deleteInterview: async (interviewId) => {
    try {
      const res = await apiClient.delete(`/interviews/${interviewId}`);
      return res.data;
    } catch (error) {
      console.error("면접 기록 삭제 실패:", error);
      throw error;
    }
  }
};
