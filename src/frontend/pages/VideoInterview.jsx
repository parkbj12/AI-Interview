import React, { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getQuestions, requestFeedback } from "../api/api";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  ArrowLeft,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useSpeechRecognition } from "react-speech-recognition";

export default function VideoInterview() {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [feedbacks, setFeedbacks] = useState({});
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false); // 비디오 녹화 상태
  const [timeLeft, setTimeLeft] = useState(180);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isStarted, setIsStarted] = useState(false); // 면접 시작 여부
  const [error, setError] = useState(null);
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const finalResultsRef = useRef(''); // final 결과 추적을 위한 ref
  const location = useLocation();
  const navigate = useNavigate();
  const jobType = new URLSearchParams(location.search).get("job");
  const difficulty = new URLSearchParams(location.search).get("difficulty") || "medium";
  const questionCount = parseInt(new URLSearchParams(location.search).get("count")) || null;

  // 직무 타입을 한국어로 변환
  const getJobTypeLabel = (jobType) => {
    const jobMap = {
      "developer": "개발자",
      "designer": "디자이너",
      "data-scientist": "데이터 사이언티스트",
      "product-manager": "프로덕트 매니저",
      "planner": "기획자",
      "marketer": "마케터",
      "sales": "영업",
      "hr": "인사",
      "finance": "재무/회계",
      "admin": "총무/행정",
      "customer-service": "고객서비스",
      "teacher": "교사",
      "nurse": "간호사",
      "lawyer": "변호사",
      "accountant": "회계사",
      "retail": "유통/판매",
      "hospitality": "호텔/관광",
      "food-service": "외식업",
      "manufacturing": "제조업",
      "quality-control": "품질관리",
      "logistics": "물류/운송"
    };
    return jobMap[jobType] || jobType;
  };

  // 난이도를 한국어로 변환
  const getDifficultyLabel = (difficulty) => {
    const difficultyMap = {
      "easy": "초급",
      "medium": "중급",
      "hard": "고급"
    };
    return difficultyMap[difficulty] || difficulty;
  };

  // 네이티브 Web Speech API 직접 사용 (폴백)
  const [nativeTranscript, setNativeTranscript] = useState("");
  const [nativeListening, setNativeListening] = useState(false);
  const nativeRecognitionRef = useRef(null);

  // 브라우저의 Web Speech API 직접 확인
  const [speechRecognitionSupported, setSpeechRecognitionSupported] = useState(false);
  
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechRecognitionSupported(true);
      // 네이티브 인식 객체 생성
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'ko-KR';
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let newFinalTranscript = '';

        // 이전 인덱스부터 현재까지의 결과만 처리 (중복 방지)
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            newFinalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        // final 결과는 누적, interim은 현재 것만 표시
        if (newFinalTranscript) {
          finalResultsRef.current += newFinalTranscript;
        }
        
        // 최종 텍스트: 누적된 final + 현재 interim
        setNativeTranscript(finalResultsRef.current + interimTranscript);
      };

      recognition.onerror = (event) => {
        console.error("음성 인식 오류:", event.error);
        
        // aborted 오류는 사용자가 수동으로 중지했거나 다른 이유로 중단된 경우
        // 별도 처리가 필요하지 않음
        if (event.error === 'aborted') {
          console.log("음성 인식이 중단되었습니다.");
          setNativeListening(false);
          return;
        }
        
        // 다른 오류의 경우
        if (event.error === 'no-speech') {
          console.log("음성이 감지되지 않았습니다. 계속 시도합니다.");
          // 자동으로 재시작
          if (nativeListening && nativeRecognitionRef.current) {
            try {
              nativeRecognitionRef.current.start();
            } catch (e) {
              console.log("재시작 실패:", e);
            }
          }
        } else if (event.error === 'network') {
          console.error("네트워크 오류로 음성 인식을 시작할 수 없습니다.");
          setNativeListening(false);
          setIsRecording(false);
        } else if (event.error === 'not-allowed') {
          console.error("마이크 권한이 거부되었습니다.");
          alert("마이크 권한이 필요합니다. 브라우저 설정에서 마이크 권한을 허용해주세요.");
          setNativeListening(false);
          setIsRecording(false);
        } else {
          console.error("음성 인식 오류:", event.error);
          setNativeListening(false);
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        // 사용자가 수동으로 중지한 경우가 아니라면 자동 재시작
        if (nativeListening && !isAnswered) {
          try {
            nativeRecognitionRef.current.start();
          } catch (e) {
            // 이미 실행 중이거나 다른 이유로 시작할 수 없는 경우
            console.log("음성 인식 종료, 재시작 불가:", e);
            setNativeListening(false);
            setIsRecording(false);
          }
        } else {
          setNativeListening(false);
        }
      };

      nativeRecognitionRef.current = recognition;
    } else {
      console.warn("브라우저가 Web Speech API를 지원하지 않습니다.");
      setSpeechRecognitionSupported(false);
    }
  }, []);

  // 음성 인식 초기화 (react-speech-recognition)
  const speechRecognitionHook = useSpeechRecognition({
    continuous: true,
    interimResults: true
  });

  const {
    transcript: hookTranscript,
    listening: hookListening,
    resetTranscript,
    startListening,
    stopListening,
    browserSupportsSpeechRecognition
  } = speechRecognitionHook || {};

  // 라이브러리 사용 가능 여부 확인
  const useLibrary = typeof startListening === 'function' && typeof stopListening === 'function';
  const transcript = useLibrary ? hookTranscript : nativeTranscript;
  const listening = useLibrary ? hookListening : nativeListening;

  // 음성 인식 지원 여부 확인 및 폴백 처리
  useEffect(() => {
    if (!speechRecognitionSupported) {
      console.warn("브라우저가 음성 인식을 지원하지 않습니다. 텍스트 입력만 사용 가능합니다.");
    } else if (!useLibrary) {
      console.log("react-speech-recognition 사용 불가, 네이티브 Web Speech API 사용 중");
    }
  }, [speechRecognitionSupported, useLibrary]);

  const timeLimits = {
    easy: 120,
    medium: 180,
    hard: 240
  };

  // 카메라 시작
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user"
        },
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsVideoOn(true);
      }
    } catch (err) {
      console.error("카메라 접근 실패:", err);
      setError("카메라 접근 권한이 필요합니다. 브라우저 설정을 확인해주세요.");
    }
  };

  // 비디오 녹화 시작
  const startVideoRecording = async () => {
    if (!streamRef.current) {
      alert("카메라가 켜져있지 않습니다.");
      return;
    }

    try {
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus',
        videoBitsPerSecond: 2500000
      };

      // 지원되는 코덱 확인
      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'video/webm;codecs=vp8,opus';
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
        }
      }

      const mediaRecorder = new MediaRecorder(streamRef.current, options);
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        // 녹화된 비디오는 나중에 서버로 전송하여 분석할 수 있음
        console.log("녹화 완료:", blob);
      };

      mediaRecorder.start(1000); // 1초마다 데이터 수집
      mediaRecorderRef.current = mediaRecorder;
      setIsVideoRecording(true);
    } catch (err) {
      console.error("비디오 녹화 시작 실패:", err);
      alert("비디오 녹화를 시작할 수 없습니다.");
    }
  };

  // 비디오 녹화 중지
  const stopVideoRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsVideoRecording(false);
    }
  };

  // 면접 시작 - 녹화와 녹음 자동 시작
  const handleStartInterview = async () => {
    if (!isVideoOn) {
      await startCamera();
      // 카메라 시작 후 최소 지연 (100ms로 단축)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 음성 인식과 비디오 녹화를 동시에 시작 (병렬 처리)
    const promises = [];

    // 음성 인식 시작
    if (speechRecognitionSupported) {
      if (useLibrary && startListening) {
        if (resetTranscript) {
          resetTranscript();
        }
        startListening();
        setIsRecording(true);
      } else if (nativeRecognitionRef.current) {
        const hasPermission = await checkMicrophonePermission();
        if (hasPermission) {
          setNativeTranscript("");
          finalResultsRef.current = ""; // final 결과 초기화
          setNativeListening(true);
          nativeRecognitionRef.current.start();
          setIsRecording(true);
        }
      }
    }

    // 비디오 녹화 시작 (병렬 처리)
    startVideoRecording();

    setIsStarted(true);
  };

  // 카메라 중지
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoOn(false);
  };

  // 모든 리소스 정리 (카메라, 음성 인식, 비디오 녹화)
  const cleanupAllResources = useCallback(() => {
    // 비디오 녹화 중지
    stopVideoRecording();
    
    // 카메라 중지
    stopCamera();
    
    // 음성 인식 중지
    if (nativeRecognitionRef.current && nativeListening) {
      try {
        nativeRecognitionRef.current.stop();
      } catch (e) {
        console.log("음성 인식 중지 중 오류:", e);
      }
      setNativeListening(false);
    }
    
    if (useLibrary && listening && stopListening) {
      try {
        stopListening();
      } catch (e) {
        console.log("음성 인식 중지 중 오류:", e);
      }
    }
    
    setIsRecording(false);
    setIsVideoRecording(false);
  }, [nativeListening, useLibrary, listening, stopListening]);

  // 질문 로드
  useEffect(() => {
    // 사용자 질문이 state로 전달된 경우
    if (location.state?.customQuestions && location.state?.useCustom) {
      console.log("사용자 질문 사용:", location.state.customQuestions);
      setQuestions(location.state.customQuestions);
      // 사용자 질문의 난이도에 맞춰 타이머 설정 (기본값: medium)
      const customDifficulty = location.state.difficulty || difficulty || 'medium';
      setTimeLeft(timeLimits[customDifficulty]);
      // 자동으로 카메라 시작
      startCamera();
      return;
    }
    
    const fetchData = async () => {
      try {
        const data = await getQuestions(jobType || 'developer', difficulty, questionCount);
        setQuestions(data);
        setTimeLeft(timeLimits[difficulty]);
        // 자동으로 카메라 시작
        startCamera();
      } catch (error) {
        console.error("질문 불러오기 실패:", error);
        setError("질문을 불러오는데 실패했습니다.");
      }
    };
    
    fetchData();

    // 컴포넌트 언마운트 시 모든 리소스 정리
    return () => {
      cleanupAllResources();
    };
  }, [jobType, location.state]);

  // 타이머
  useEffect(() => {
    if (timeLeft > 0 && !isAnswered && questions.length > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && !isAnswered) {
      handleSubmit();
    }
  }, [timeLeft, isAnswered]);

  // 음성 인식 결과를 답변에 추가 (디바운싱으로 중복 방지 및 딜레이 최소화)
  useEffect(() => {
    if (!transcript || isAnswered) return;
    
    // 디바운싱: 150ms마다만 업데이트 (300ms -> 150ms로 단축)
    const timeoutId = setTimeout(() => {
      setAnswers(prev => {
        const currentAnswer = prev[currentQuestionIndex] || '';
        const newAnswer = transcript.trim();
        // 현재 답변과 다를 때만 업데이트 (중복 방지)
        if (currentAnswer !== newAnswer && newAnswer.length > 0) {
          return {
            ...prev,
            [currentQuestionIndex]: newAnswer
          };
        }
        return prev;
      });
    }, 150); // 300ms -> 150ms로 단축

    return () => clearTimeout(timeoutId);
  }, [transcript, currentQuestionIndex, isAnswered]);

  // 질문이 변경될 때 답변 텍스트 영역 초기화
  useEffect(() => {
    // 현재 질문에 대한 답변이 없으면 빈 문자열로 설정
    if (!answers[currentQuestionIndex]) {
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: ""
      }));
    }
    // 음성 인식 텍스트도 초기화
    if (useLibrary && resetTranscript) {
      resetTranscript();
    } else {
      setNativeTranscript("");
      finalResultsRef.current = ""; // final 결과도 초기화
    }
  }, [currentQuestionIndex]);

  // 컴포넌트 언마운트 시 음성 인식 정리
  useEffect(() => {
    return () => {
      if (nativeRecognitionRef.current && nativeListening) {
        nativeRecognitionRef.current.stop();
      }
      if (useLibrary && listening && stopListening) {
        stopListening();
      }
    };
  }, []);

  // 페이지를 떠날 때 (location 변경 시) 모든 리소스 정리
  useEffect(() => {
    // location.pathname이 변경되면 리소스 정리
    // 이는 헤더의 Link 클릭 등으로 페이지 이동 시 실행됨
    return () => {
      cleanupAllResources();
    };
  }, [location.pathname, cleanupAllResources]);

  // beforeunload 이벤트로 브라우저 닫기/새로고침 시 리소스 정리
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      cleanupAllResources();
      // 리소스 정리는 했지만 브라우저 기본 경고는 표시
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [cleanupAllResources]);

  // 마이크 권한 및 연결 상태 확인
  const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // 권한이 있으면 스트림 정리
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (error) {
      console.error("마이크 권한 확인 실패:", error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        alert("마이크 권한이 거부되었습니다.\n\n브라우저 주소창 왼쪽의 자물쇠 아이콘을 클릭하여 마이크 권한을 허용해주세요.");
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        alert("마이크를 찾을 수 없습니다.\n\n마이크가 연결되어 있는지 확인해주세요.");
      } else {
        alert("마이크 접근에 실패했습니다.\n\n오류: " + error.message);
      }
      return false;
    }
  };

  // 음성 녹음 시작/중지
  const toggleRecording = async () => {
    try {
      if (!speechRecognitionSupported) {
        alert("이 브라우저는 음성 인식을 지원하지 않습니다.\n\nChrome 또는 Edge 브라우저를 사용해주세요.\n현재는 텍스트 입력만 사용 가능합니다.");
        return;
      }

      if (listening) {
        // 녹음 중지
        if (useLibrary && stopListening) {
          stopListening();
        } else if (nativeRecognitionRef.current) {
          try {
            nativeRecognitionRef.current.stop();
          } catch (e) {
            console.log("음성 인식 중지 중 오류 (무시 가능):", e);
          }
        }
        setIsRecording(false);
        setNativeListening(false);
      } else {
        // 녹음 시작
        if (useLibrary && startListening) {
          // react-speech-recognition 사용
          if (resetTranscript) {
            resetTranscript();
          }
          // 답변 텍스트 영역도 초기화
          setAnswers(prev => ({
            ...prev,
            [currentQuestionIndex]: ""
          }));
          startListening();
        } else if (nativeRecognitionRef.current) {
          // 네이티브 Web Speech API 사용
          // 먼저 마이크 권한 확인
          const hasPermission = await checkMicrophonePermission();
          if (!hasPermission) {
            setIsRecording(false);
            setNativeListening(false);
            return;
          }

          try {
            // 음성 인식 시작 전에 현재 질문의 답변 텍스트 초기화
            setNativeTranscript("");
            setAnswers(prev => ({
              ...prev,
              [currentQuestionIndex]: ""
            }));
            setNativeListening(true);
            nativeRecognitionRef.current.start();
          } catch (e) {
            console.error("음성 인식 시작 실패:", e);
            if (e.message && e.message.includes('already started')) {
              // 이미 시작된 경우 무시
              console.log("음성 인식이 이미 실행 중입니다.");
            } else {
              alert("음성 인식을 시작할 수 없습니다.\n\n텍스트 입력을 사용해주세요.");
              setNativeListening(false);
              setIsRecording(false);
              return;
            }
          }
        } else {
          alert("음성 인식을 시작할 수 없습니다.\n\n텍스트 입력을 사용해주세요.");
          return;
        }
        setIsRecording(true);
      }
    } catch (error) {
      console.error("음성 녹음 토글 실패:", error);
      alert("음성 녹음을 시작할 수 없습니다.\n\n텍스트 입력을 사용해주세요.\n브라우저 콘솔(F12)을 확인해주세요.");
      setIsRecording(false);
    }
  };

  // 답변 제출
  const handleSubmit = async () => {
    const answer = answers[currentQuestionIndex] || "";
    if (!answer.trim()) {
      alert("답변을 말해주세요.");
      return;
    }

    setIsAnswered(true);
    
    // 음성 인식 중지
    if (useLibrary && stopListening) {
      stopListening();
    } else if (nativeRecognitionRef.current) {
      nativeRecognitionRef.current.stop();
    }
    setIsRecording(false);

    // 현재 질문에 대한 비디오 녹화 중지
    stopVideoRecording();

    try {
      const currentQuestion = questions[currentQuestionIndex];
      const feedback = await requestFeedback(currentQuestion.question, answer);
      setFeedbacks(prev => ({ ...prev, [currentQuestionIndex]: feedback }));
      
      // 다음 질문으로 이동 (딜레이 1초로 단축)
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          // 음성 인식 텍스트 초기화
          if (useLibrary && resetTranscript) {
            resetTranscript();
          } else {
            setNativeTranscript("");
            finalResultsRef.current = ""; // final 결과도 초기화
          }
          // 답변 상태 초기화
          setCurrentQuestionIndex(prev => prev + 1);
          setIsAnswered(false);
          setTimeLeft(timeLimits[difficulty]);
          
          // 다음 질문 시작 시 자동으로 녹화/녹음 재시작 (즉시 시작)
          if (isStarted) {
            // 음성 인식 재시작
            if (useLibrary && startListening) {
              startListening();
              setIsRecording(true);
            } else if (nativeRecognitionRef.current) {
              setNativeListening(true);
              nativeRecognitionRef.current.start();
              setIsRecording(true);
            }
            // 비디오 녹화 재시작
            startVideoRecording();
          }
        }, 1000); // 2초 -> 1초로 단축
      } else {
        // 모든 질문 완료 - 녹화 완전히 중지
        stopVideoRecording();
        // 면접 완료
        navigate("/feedback", {
          state: {
            jobType,
            difficulty,
            answers,
            feedbacks: { ...feedbacks, [currentQuestionIndex]: feedback },
            questions
          }
        });
      }
    } catch (error) {
      console.error("피드백 요청 실패:", error);
      alert("피드백을 받는데 실패했습니다.");
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeLeft <= 30) return "#ef4444";
    if (timeLeft <= 60) return "#f59e0b";
    return "#10b981";
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (error && !questions.length) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "40px"
      }}>
        <AlertCircle size={48} color="#ef4444" style={{ marginBottom: "20px" }} />
        <h3 style={{ color: "#374151", marginBottom: "8px" }}>오류가 발생했습니다</h3>
        <p style={{ color: "#6b7280", marginBottom: "20px" }}>{error}</p>
        <button
          onClick={() => {
            cleanupAllResources();
            navigate("/");
          }}
          style={{
            padding: "12px 24px",
            backgroundColor: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "400px",
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "40px"
      }}>
        <p style={{ color: "#6b7280" }}>질문을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* 헤더 */}
      <div style={{
        backgroundColor: "white",
        borderRadius: "16px",
        padding: "24px",
        marginBottom: "20px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <button
            onClick={() => {
              cleanupAllResources();
              navigate("/");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "8px 16px",
              backgroundColor: "transparent",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#374151"
            }}
          >
            <ArrowLeft size={16} />
            홈으로
          </button>
          
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isVideoOn ? (
                <Video size={20} color="#10b981" />
              ) : (
                <VideoOff size={20} color="#ef4444" />
              )}
              <span style={{ fontSize: "14px", color: "#6b7280" }}>
                {isVideoOn ? "카메라 켜짐" : "카메라 꺼짐"}
              </span>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: getTimeColor(), fontWeight: "bold" }}>
              <Clock size={20} />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        {/* 진행률 바 */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              질문 {currentQuestionIndex + 1} / {questions.length}
            </span>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              {Math.round(progress)}% 완료
            </span>
          </div>
          <div style={{
            width: "100%",
            height: "8px",
            backgroundColor: "#e5e7eb",
            borderRadius: "4px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${progress}%`,
              height: "100%",
              backgroundColor: "#3b82f6",
              transition: "width 0.3s ease"
            }} />
          </div>
        </div>

        <h2 style={{ 
          margin: 0, 
          color: "#1f2937",
          fontSize: "1.5rem",
          fontWeight: "600"
        }}>
          영상 면접 - {location.state?.useCustom ? "내 질문" : getJobTypeLabel(jobType)} ({getDifficultyLabel(difficulty)})
        </h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {/* 영상 화면 */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          <h3 style={{ marginBottom: "16px", color: "#1f2937" }}>내 영상</h3>
          <div style={{
            width: "100%",
            aspectRatio: "16/9",
            backgroundColor: "#000",
            borderRadius: "12px",
            overflow: "hidden",
            position: "relative",
            marginBottom: "16px"
          }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover"
              }}
            />
            {!isVideoOn && (
              <div style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "white",
                textAlign: "center"
              }}>
                <VideoOff size={48} style={{ marginBottom: "8px" }} />
                <p>카메라가 꺼져있습니다</p>
              </div>
            )}
          </div>
          
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            {!isStarted && (
              <button
                onClick={isVideoOn ? stopCamera : startCamera}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "12px 24px",
                  backgroundColor: isVideoOn ? "#ef4444" : "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontSize: "16px"
                }}
              >
                {isVideoOn ? <VideoOff size={20} /> : <Video size={20} />}
                {isVideoOn ? "카메라 끄기" : "카메라 켜기"}
              </button>
            )}
            {isStarted && (
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                backgroundColor: isVideoRecording ? "#fef2f2" : "#f3f4f6",
                borderRadius: "8px",
                border: `2px solid ${isVideoRecording ? "#ef4444" : "#d1d5db"}`
              }}>
                {isVideoRecording && (
                  <div style={{
                    width: "10px",
                    height: "10px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                    animation: "pulse 1s infinite"
                  }} />
                )}
                <Video size={20} color={isVideoRecording ? "#ef4444" : "#6b7280"} />
                <span style={{ fontSize: "14px", color: isVideoRecording ? "#991b1b" : "#6b7280", fontWeight: "500" }}>
                  {isVideoRecording ? "녹화 중" : "녹화 중지"}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 질문 및 답변 영역 */}
        <div style={{
          backgroundColor: "white",
          borderRadius: "16px",
          padding: "24px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
        }}>
          {currentQuestion && (
            <>
              <div style={{ marginBottom: "20px" }}>
                <div style={{ 
                  fontSize: "18px",
                  fontWeight: "500",
                  lineHeight: "1.5",
                  color: "#1f2937",
                  marginBottom: "16px"
                }}>
                  {currentQuestion.question}
                </div>
              </div>

              {/* 시작 버튼 - 면접 시작 전에만 표시 */}
              {!isStarted && (
                <div style={{ marginBottom: "20px" }}>
                  <button
                    onClick={handleStartInterview}
                    disabled={!isVideoOn}
                    style={{
                      width: "100%",
                      padding: "16px 32px",
                      fontSize: "18px",
                      fontWeight: "600",
                      backgroundColor: isVideoOn ? "#10b981" : "#9ca3af",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      cursor: isVideoOn ? "pointer" : "not-allowed",
                      transition: "all 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: isVideoOn ? "0 4px 12px rgba(16, 185, 129, 0.4)" : "none"
                    }}
                  >
                    <Play size={24} />
                    면접 시작하기
                  </button>
                  {!isVideoOn && (
                    <p style={{ textAlign: "center", color: "#6b7280", marginTop: "12px", fontSize: "14px" }}>
                      카메라를 먼저 켜주세요
                    </p>
                  )}
                </div>
              )}

              {/* 답변 상태 표시 - 면접 시작 후 */}
              {isStarted && !isAnswered && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{
                    padding: "20px",
                    backgroundColor: "#f0f9ff",
                    borderRadius: "12px",
                    border: "2px solid #0ea5e9",
                    textAlign: "center"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px", marginBottom: "12px" }}>
                      {isRecording && (
                        <div style={{
                          width: "12px",
                          height: "12px",
                          backgroundColor: "#ef4444",
                          borderRadius: "50%",
                          animation: "pulse 1s infinite"
                        }} />
                      )}
                      <Mic size={24} color={isRecording ? "#ef4444" : "#6b7280"} />
                      {isVideoRecording && (
                        <div style={{
                          width: "12px",
                          height: "12px",
                          backgroundColor: "#ef4444",
                          borderRadius: "50%",
                          animation: "pulse 1s infinite"
                        }} />
                      )}
                      <Video size={24} color={isVideoRecording ? "#ef4444" : "#6b7280"} />
                    </div>
                    <p style={{ margin: 0, color: "#0c4a6e", fontWeight: "600", fontSize: "16px" }}>
                      {isRecording && isVideoRecording ? "녹화 및 녹음 중..." : "준비 중..."}
                    </p>
                    <p style={{ margin: "8px 0 0 0", color: "#0284c7", fontSize: "14px" }}>
                      답변을 말씀해주세요. 음성으로 자동 인식됩니다.
                    </p>
                    {answers[currentQuestionIndex] && (
                      <div style={{
                        marginTop: "16px",
                        padding: "12px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        textAlign: "left",
                        maxHeight: "150px",
                        overflowY: "auto"
                      }}>
                        <p style={{ margin: 0, color: "#1f2937", fontSize: "14px", lineHeight: "1.6" }}>
                          {answers[currentQuestionIndex]}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {listening && (
                <div style={{
                  padding: "12px",
                  backgroundColor: "#fef3c7",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                  <div style={{
                    width: "8px",
                    height: "8px",
                    backgroundColor: "#ef4444",
                    borderRadius: "50%",
                    animation: "pulse 1s infinite"
                  }} />
                  <span style={{ color: "#92400e" }}>음성 인식 중...</span>
                </div>
              )}

              {/* 제출 버튼 */}
              {!isAnswered && (
                <button
                  onClick={handleSubmit}
                  disabled={!answers[currentQuestionIndex]?.trim()}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    backgroundColor: answers[currentQuestionIndex]?.trim() ? "#10b981" : "#9ca3af",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: answers[currentQuestionIndex]?.trim() ? "pointer" : "not-allowed",
                    fontSize: "16px",
                    fontWeight: "500"
                  }}
                >
                  답변 제출
                </button>
              )}

              {/* 피드백 */}
              {feedbacks[currentQuestionIndex] && (() => {
                const feedbackData = feedbacks[currentQuestionIndex];
                const feedbackText = typeof feedbackData === 'string' 
                  ? feedbackData 
                  : feedbackData.feedback || "";
                
                return (
                  <div style={{
                    marginTop: "20px",
                    padding: "16px",
                    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                    borderRadius: "8px",
                    border: "1px solid #0ea5e9"
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      marginBottom: "12px",
                      color: "#0369a1",
                      fontWeight: "600"
                    }}>
                      <CheckCircle size={20} />
                      <span>AI 피드백</span>
                      {typeof feedbackData === 'object' && feedbackData.score !== undefined && (
                        <span style={{
                          padding: "2px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: "600",
                          backgroundColor: feedbackData.score >= 80 ? "#d1fae5" : feedbackData.score >= 60 ? "#fef3c7" : "#fee2e2",
                          color: feedbackData.score >= 80 ? "#065f46" : feedbackData.score >= 60 ? "#92400e" : "#991b1b"
                        }}>
                          {feedbackData.score}점
                        </span>
                      )}
                    </div>
                    <p style={{
                      whiteSpace: "pre-wrap",
                      margin: 0,
                      lineHeight: "1.6",
                      color: "#0c4a6e"
                    }}>
                      {feedbackText}
                    </p>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </div>

    </div>
  );
}

