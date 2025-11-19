import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getQuestionsByJob } from '../data/interviewQuestions';

const VideoInterview = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  // location.state에서 전달된 데이터가 있으면 사용
  const preloadedData = location.state || {};
  
  const [job, setJob] = useState(preloadedData.job || '');
  const [difficulty, setDifficulty] = useState(preloadedData.difficulty || 'medium');
  const [mode, setMode] = useState(preloadedData.mode || 'practice');
  const [companyName, setCompanyName] = useState(preloadedData.companyName || '');
  const [questionCount, setQuestionCount] = useState(preloadedData.questions?.length || 3);
  const [questions, setQuestions] = useState(preloadedData.questions || []);
  const [answers, setAnswers] = useState([]); // 녹음된 오디오 데이터 저장
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isStarted, setIsStarted] = useState(!!preloadedData.questions?.length);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null); // 실전 모드 시간 제한 (초)
  const [timerInterval, setTimerInterval] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [streamReady, setStreamReady] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 오디오 레벨 (0-100)
  const [audioData, setAudioData] = useState(new Uint8Array(0)); // 실시간 오디오 데이터
  const [answerCompleted, setAnswerCompleted] = useState([]); // 각 질문별 답변 완료 여부 추적
  const [answerAttempts, setAnswerAttempts] = useState([]); // 각 질문별 완료된 답변 시도 횟수 (0, 1, 2)
  const [currentAttempt, setCurrentAttempt] = useState(1); // 현재 시도 중인 횟수 (1 또는 2, 최대 2)
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const timerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const audioChunksRef = useRef([]);
  const finalRecordingTimeRef = useRef(0); // 최종 녹음 시간 저장용
  const currentAttemptRef = useRef(1); // 현재 시도 횟수 ref (클로저 문제 해결)
  
  useEffect(() => {
    if (preloadedData.questions?.length) {
      setAnswers(Array(preloadedData.questions.length).fill(''));
      setAnswerCompleted(Array(preloadedData.questions.length).fill(false));
      setAnswerAttempts(Array(preloadedData.questions.length).fill(0));
    }
  }, [preloadedData.questions]);

  // handleAutoNext 함수를 먼저 정의 (useEffect보다 앞에)
  const handleAutoNext = useCallback(() => {
    // 현재 질문의 답변이 완료되었는지 확인 (답변 완료 버튼을 눌렀는지 확인)
    const isCurrentAnswerCompleted = answerCompleted[currentQuestionIndex] === true;
    
    // 답변이 완료되지 않았으면 자동으로 넘어가지 않음
    if (!isCurrentAnswerCompleted) {
      console.log('⚠️ 답변이 완료되지 않아 자동으로 넘어가지 않습니다.');
      // 실전 모드에서 시간이 끝났지만 답변이 없으면 경고만 표시
      alert('시간이 종료되었지만 답변이 완료되지 않았습니다. "답변 시작" 버튼을 눌러 답변을 녹음한 후 "답변 완료" 버튼을 눌러주세요.');
      return;
    }
    
    // 녹음 중이면 중지 (mediaRecorder를 직접 체크)
    if (isRecording && mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      // 오디오 레벨 모니터링 중지
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setAudioLevel(0);
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(console.error);
        audioContextRef.current = null;
      }
      analyserRef.current = null;
    }

    // 다음 질문으로 이동
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setRecordingTime(0);
    } else {
      // 마지막 질문이면 면접 완료
      const processedAnswers = answers.map((a) => {
        if (!a) return null;
        if (Array.isArray(a)) {
          const lastAnswer = a[a.length - 1];
          if (lastAnswer?.base64Audio) {
            return {
              type: 'audio',
              base64Audio: lastAnswer.base64Audio,
              mimeType: lastAnswer.mimeType || 'audio/webm',
              duration: lastAnswer.duration || 0,
              attempt: lastAnswer.attempt || 1,
              audioUrl: lastAnswer.audioUrl || null
            };
          }
          return lastAnswer?.audioUrl || null;
        }
        if (a.base64Audio) {
          return {
            type: 'audio',
            base64Audio: a.base64Audio,
            mimeType: a.mimeType || 'audio/webm',
            duration: a.duration || 0,
            audioUrl: a.audioUrl || null
          };
        }
        return a.audioUrl || '';
      });
      
      navigate('/feedback', {
        state: { 
          questions, 
          answers: processedAnswers,
          job, 
          difficulty, 
          mode, 
          companyName,
          interviewType: 'video'
        },
      });
    }
  }, [isRecording, mediaRecorder, answers, answerCompleted, currentQuestionIndex, questions, navigate, job, difficulty, mode, companyName]);

  // 답변 시간 제한 설정 - "답변 시작" 버튼을 눌렀을 때만 타이머 시작
  // (자동으로 시작하지 않음)

  // 타이머 동작
  useEffect(() => {
    // 기존 타이머 정리
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    if (isStarted && timeLeft !== null && timeLeft > 0) {
      console.log('⏱️ 답변 타이머 시작:', timeLeft);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev === null || prev <= 1) {
            console.log('⏱️ 시간 종료');
            // 기존 타이머 정리
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            // 시간 종료 시 녹음 중이면 자동으로 중지
            if (mediaRecorder && mediaRecorder.state !== 'inactive') {
              stopRecording();
            }
            // 시간 종료 시 자동으로 다음 질문으로 이동하지 않고, 사용자가 직접 다음으로 넘어가도록 함
            setTimeLeft(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isStarted, timeLeft, mediaRecorder]);

  // 시간 종료 시 1차 답변 완료 상태면 자동으로 2차 답변 기회로 전환
  useEffect(() => {
    if (isStarted && timeLeft === 0 && !isRecording && currentAttempt === 1) {
      const currentAttemptCount = answerAttempts[currentQuestionIndex] || 0;
      const isCurrentAnswerCompleted = answerCompleted[currentQuestionIndex] === true;
      
      // 1차 답변이 완료되었고 아직 2차 답변을 하지 않은 경우, 자동으로 타이머 리셋
      if (isCurrentAnswerCompleted && currentAttemptCount === 1 && currentAttemptCount < 2) {
        // 난이도별 시간 제한: 초급 120초, 중급 90초, 고급 60초
        let timeLimit = 90; // 기본값 (중급)
        if (difficulty === 'easy') {
          timeLimit = 120; // 초급: 2분
        } else if (difficulty === 'medium') {
          timeLimit = 90; // 중급: 1분 30초
        } else if (difficulty === 'hard') {
          timeLimit = 60; // 고급: 1분
        }
        console.log(`⏱️ 1차 답변 완료 후 시간 종료 - 2차 답변 기회로 자동 전환 (${timeLimit}초)`);
        setTimeLeft(timeLimit); // 타이머 리셋
        setCurrentAttempt(2); // 2차 답변으로 설정
        currentAttemptRef.current = 2;
      }
    }
  }, [timeLeft, isStarted, isRecording, answerAttempts, answerCompleted, currentQuestionIndex, currentAttempt, difficulty]);

  // 질문이 변경될 때마다 타이머 중지 및 시도 횟수 초기화
  useEffect(() => {
    if (isStarted) {
      // 타이머 중지 (답변 시작 버튼을 눌러야 시작)
      setTimeLeft(null);
      // 기존 타이머 정리
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setCurrentAttempt(1); // 시도 횟수 초기화
      currentAttemptRef.current = 1; // ref도 초기화
    }
  }, [currentQuestionIndex, isStarted]);
  
  // currentAttempt가 변경될 때마다 ref 업데이트
  useEffect(() => {
    currentAttemptRef.current = currentAttempt;
  }, [currentAttempt]);

  useEffect(() => {
    if (isStarted && videoRef.current) {
      // 미디어 접근 API 지원 확인
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // 구형 API 폴백 시도
        const getMedia = navigator.mediaDevices?.getUserMedia || 
                        navigator.getUserMedia || 
                        navigator.webkitGetUserMedia || 
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia;
        
        if (!getMedia) {
          console.error('❌ 미디어 접근 API를 지원하지 않는 브라우저입니다.');
          setStreamReady(false);
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const isHTTPS = window.location.protocol === 'https:';
          
          let message = '이 브라우저는 카메라/마이크 접근을 지원하지 않습니다.\n\n';
          if (!isHTTPS && !isLocalhost) {
            message += '⚠️ HTTP 환경에서는 미디어 접근이 제한됩니다.\n\n';
            message += '해결 방법:\n';
            message += '1. Chrome/Edge: 주소창에 "chrome://flags/#unsafely-treat-insecure-origin-as-secure" 입력\n';
            message += '   → "172.16.17.182:3000" 추가 후 브라우저 재시작\n';
            message += '2. 또는 HTTPS로 접속 (https://172.16.17.182:3000)\n';
            message += '3. 또는 같은 컴퓨터에서 localhost로 접속\n';
          } else {
            message += 'Chrome, Edge, Firefox 최신 버전을 사용해주세요.';
          }
          alert(message);
          return;
        }
        
        // 구형 API 사용 (콜백 방식)
        const constraints = {
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        };
        
        // 구형 API는 navigator.getUserMedia(constraints, success, error) 형태
        if (typeof getMedia === 'function') {
          getMedia(constraints, (stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            streamRef.current = stream;
            setStreamReady(true);
            console.log('✅ 미디어 스트림 연결 완료 (구형 API)');
          }, (error) => {
            console.error('❌ 미디어 접근 오류:', error);
            setStreamReady(false);
            alert('카메라와 마이크 접근 권한이 필요합니다. 브라우저 설정에서 권한을 허용해주세요.\n\n또한 HTTPS 환경에서 접속하시거나 localhost에서 접속해주세요.');
          });
        } else {
          setStreamReady(false);
          alert('미디어 접근 API를 지원하지 않습니다. HTTPS 환경에서 접속하거나 localhost를 사용해주세요.');
        }
        return;
      }
      
      // 고품질 오디오 설정
      const audioConstraints = {
        echoCancellation: true,      // 에코 제거
        noiseSuppression: true,       // 노이즈 제거
        autoGainControl: true,       // 자동 게인 제어
        sampleRate: 48000,           // 48kHz 샘플레이트 (고품질)
        channelCount: 1,             // 모노 채널
        sampleSize: 16,              // 16-bit 샘플
        latency: 0,                  // 최소 지연 시간
      };
      
      const videoConstraints = {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      };
      
      navigator.mediaDevices
        .getUserMedia({ 
          video: videoConstraints,
          audio: audioConstraints 
        })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          streamRef.current = stream;
          setStreamReady(true);
          
          // 오디오 트랙 설정 확인
          const audioTracks = stream.getAudioTracks();
          if (audioTracks.length > 0) {
            const settings = audioTracks[0].getSettings();
            console.log('✅ 미디어 스트림 연결 완료:', {
              sampleRate: settings.sampleRate,
              channelCount: settings.channelCount,
              echoCancellation: settings.echoCancellation,
              noiseSuppression: settings.noiseSuppression,
              autoGainControl: settings.autoGainControl
            });
          }
        })
        .catch((error) => {
          console.error('❌ 미디어 접근 오류:', error);
          setStreamReady(false);
          let errorMessage = '카메라와 마이크 접근 권한이 필요합니다.';
          
          if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
            errorMessage = '카메라와 마이크 접근 권한이 거부되었습니다. 브라우저 설정에서 권한을 허용해주세요.';
          } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
            errorMessage = '카메라나 마이크를 찾을 수 없습니다. 장치가 연결되어 있는지 확인해주세요.';
          } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
            errorMessage = '카메라나 마이크가 다른 프로그램에서 사용 중입니다.';
          } else if (error.name === 'OverconstrainedError' || error.name === 'ConstraintNotSatisfiedError') {
            errorMessage = '요청한 설정을 지원하지 않습니다. 기본 설정으로 시도합니다.';
            // 기본 설정으로 재시도
            navigator.mediaDevices.getUserMedia({ video: true, audio: true })
              .then((stream) => {
                if (videoRef.current) {
                  videoRef.current.srcObject = stream;
                }
                streamRef.current = stream;
                setStreamReady(true);
                console.log('✅ 기본 설정으로 미디어 스트림 연결 완료');
              })
              .catch((retryError) => {
                console.error('❌ 재시도 실패:', retryError);
                alert('미디어 접근에 실패했습니다. 페이지를 새로고침하거나 다른 브라우저를 사용해주세요.');
              });
            return;
          }
          
          alert(errorMessage + '\n\n오류: ' + error.message);
        });
    }
    
    // 컴포넌트 언마운트 시 스트림 정리
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      stopAudioLevelMonitoring();
    };
  }, [isStarted]);

  const startInterview = () => {
    // 이미 질문이 있으면 사용, 없으면 직무별 실제 면접 질문 가져오기
    if (questions.length === 0) {
      const jobQuestions = getQuestionsByJob(job, 10, difficulty); // 난이도에 맞는 질문만 가져오기
      
      // 난이도 필터링 후 질문이 부족한 경우 처리
      if (jobQuestions.length === 0) {
        alert('선택한 난이도에 해당하는 질문이 없습니다. 다른 난이도를 선택해주세요.');
        return;
      }
      
      // 요청한 질문 개수만큼 샘플링 (더 나은 랜덤 선택)
      if (jobQuestions.length > questionCount) {
        // Fisher-Yates 셔플 알고리즘 사용 (더 나은 랜덤성)
        const shuffled = [...jobQuestions];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        // 시간 기반 추가 랜덤성
        const timeSeed = Date.now() % shuffled.length;
        const rotated = [...shuffled.slice(timeSeed), ...shuffled.slice(0, timeSeed)];
        const selectedQuestions = rotated.slice(0, questionCount);
        setQuestions(selectedQuestions);
        setAnswers(Array(selectedQuestions.length).fill(''));
        setAnswerCompleted(Array(selectedQuestions.length).fill(false));
        setAnswerAttempts(Array(selectedQuestions.length).fill(0));
      } else {
        setQuestions(jobQuestions);
        setAnswers(Array(jobQuestions.length).fill(''));
        setAnswerCompleted(Array(jobQuestions.length).fill(false));
        setAnswerAttempts(Array(jobQuestions.length).fill(0));
      }
    } else {
      setAnswers(Array(questions.length).fill(''));
      setAnswerCompleted(Array(questions.length).fill(false));
      setAnswerAttempts(Array(questions.length).fill(0));
    }
    setIsStarted(true);
  };

  const startRecording = async () => {
    try {
      // 스트림이 없으면 다시 요청
      if (!streamRef.current) {
        console.log('스트림이 없어서 다시 요청합니다...');
        try {
          // 미디어 접근 API 확인
          if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('미디어 접근 API를 지원하지 않습니다. HTTPS 환경에서 접속하거나 localhost를 사용해주세요.');
          }
          
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
          streamRef.current = stream;
          setStreamReady(true);
          console.log('✅ 스트림 재연결 완료');
        } catch (error) {
          console.error('미디어 접근 오류:', error);
          setStreamReady(false);
          let errorMessage = '카메라와 마이크 접근 권한이 필요합니다.';
          
          if (error.message.includes('HTTPS') || error.message.includes('localhost')) {
            errorMessage = 'HTTPS 환경에서 접속하거나 localhost를 사용해주세요. HTTP 환경에서는 미디어 접근이 제한됩니다.';
          }
          
          alert(errorMessage + '\n\n브라우저 설정에서 권한을 허용해주세요.');
          return;
        }
      }

      // 오디오 트랙만 추출 (비디오 트랙이 문제를 일으킬 수 있음)
      const audioTracks = streamRef.current.getAudioTracks();
      if (audioTracks.length === 0) {
        alert('오디오 트랙을 찾을 수 없습니다. 마이크가 연결되어 있는지 확인해주세요.');
        return;
      }

      // 오디오만 포함하는 새로운 스트림 생성
      const audioStream = new MediaStream(audioTracks);
      console.log('🎤 오디오 트랙:', audioTracks.length, '개');

      // 오디오 레벨 분석을 위한 AudioContext 설정 (고품질)
      try {
        // 48kHz 샘플레이트로 AudioContext 생성 (고품질)
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 48000, // 48kHz 고품질 샘플레이트
          latencyHint: 'interactive' // 낮은 지연 시간
        });
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512; // 웨이브 효과를 위한 더 높은 해상도 (더 많은 주파수 대역)
        analyser.smoothingTimeConstant = 0.1; // 매우 빠른 반응을 위해 매우 낮게 설정
        
        const microphone = audioContext.createMediaStreamSource(audioStream);
        microphone.connect(analyser);
        
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;
        
        console.log('🎤 AudioContext 설정:', {
          sampleRate: audioContext.sampleRate,
          state: audioContext.state,
          fftSize: analyser.fftSize
        });
        
        // 오디오 레벨 모니터링 시작
        startAudioLevelMonitoring();
      } catch (error) {
        console.warn('오디오 레벨 분석 초기화 실패:', error);
      }

      // MediaRecorder 지원 여부 확인
      if (!window.MediaRecorder) {
        alert('이 브라우저는 MediaRecorder를 지원하지 않습니다. Chrome, Edge, Firefox 최신 버전을 사용해주세요.');
        return;
      }

      // chunks 배열 초기화
      audioChunksRef.current = [];
      let mimeType = null;
      
      // 브라우저가 지원하는 고품질 MIME 타입 찾기 (우선순위 순)
      const supportedTypes = [
        'audio/webm;codecs=opus',  // 최고 품질 (Opus 코덱)
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/wav',               // 무손실이지만 파일 크기 큼
        'audio/aac',
      ];
      
      for (const type of supportedTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log(`✅ 지원하는 MIME 타입: ${type}`);
          break;
        }
      }
      
      // 지원하는 타입이 없으면 기본값 사용 (브라우저가 자동 선택)
      if (!mimeType) {
        console.warn('⚠️ 특정 MIME 타입을 지원하지 않아 브라우저 기본값 사용');
        mimeType = '';
      }
      
      // MediaRecorder 옵션 설정 (고품질)
      const options = mimeType ? { 
        mimeType,
        audioBitsPerSecond: 128000 // 128 kbps 비트레이트 (고품질)
      } : {
        audioBitsPerSecond: 128000 // MIME 타입이 없어도 비트레이트 설정
      };
      
      const recorder = new MediaRecorder(audioStream, options);
      
      console.log('🎙️ MediaRecorder 생성:', {
        mimeType: recorder.mimeType || '브라우저 기본값',
        state: recorder.state,
      });

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
          console.log(`📦 오디오 청크 수신: ${event.data.size} bytes, 총 청크: ${audioChunksRef.current.length}`);
        }
      };

      recorder.onerror = (event) => {
        console.error('❌ MediaRecorder 오류:', event.error);
        alert(`녹음 중 오류가 발생했습니다: ${event.error?.message || '알 수 없는 오류'}`);
        setIsRecording(false);
        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      recorder.onstop = async () => {
        console.log('⏹️ 녹음 중지, 총 청크 수:', audioChunksRef.current.length);
        const blobType = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: blobType });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // 최종 녹음 시간 사용 (ref에서 가져오거나 state에서 가져오기)
        const finalDuration = finalRecordingTimeRef.current || recordingTime;
        
        console.log('💾 오디오 저장:', {
          size: audioBlob.size,
          type: blobType,
          duration: finalDuration,
        });
        
        // 오디오를 base64로 변환 (백엔드에서 텍스트 변환용)
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Audio = reader.result.split(',')[1]; // data:audio/webm;base64, 부분 제거
          
          // 답변 저장 (오디오 데이터를 base64로 변환하여 저장)
          const newAnswers = [...answers];
          // 여러 번 시도할 수 있으므로 배열로 저장 (최대 2개)
          if (!newAnswers[currentQuestionIndex] || typeof newAnswers[currentQuestionIndex] === 'string') {
            newAnswers[currentQuestionIndex] = [];
          }
          if (!Array.isArray(newAnswers[currentQuestionIndex])) {
            newAnswers[currentQuestionIndex] = [newAnswers[currentQuestionIndex]];
          }
          
          const answerData = {
            audioBlob: audioBlob,
            audioUrl: audioUrl,
            duration: finalDuration,
            mimeType: blobType,
            base64Audio: base64Audio, // 백엔드 전송용 base64 데이터
            attempt: currentAttempt, // 시도 횟수
          };
          
          newAnswers[currentQuestionIndex][currentAttempt - 1] = answerData;
          setAnswers(newAnswers);
          
          // 시도 횟수 업데이트 (완료된 시도 횟수)
          // ref에서 최신 currentAttempt 값 가져오기 (클로저 문제 해결)
          const latestAttempt = currentAttemptRef.current;
          const completedAttempt = Math.min(Math.max(latestAttempt, 1), 2); // 1~2 범위로 제한
          console.log(`✅ ${currentQuestionIndex + 1}번 질문 ${completedAttempt}차 답변 완료`);
          const newAttempts = [...answerAttempts];
          newAttempts[currentQuestionIndex] = completedAttempt;
          setAnswerAttempts(newAttempts);
          console.log(`📊 업데이트된 시도 횟수:`, newAttempts);
          
          // 답변 완료 상태 업데이트 (1번 이상 답변했으면 완료로 간주)
          const newCompleted = [...answerCompleted];
          newCompleted[currentQuestionIndex] = true;
          setAnswerCompleted(newCompleted);
          
          // 2번 시도했으면 다음 시도 불가
          if (completedAttempt >= 2) {
            console.log('✅ 최대 시도 횟수(2회)에 도달했습니다.');
            // currentAttempt도 2로 고정 (더 이상 증가하지 않도록)
            setCurrentAttempt(2);
          }
        };
        reader.onerror = (error) => {
          console.error('❌ 오디오 base64 변환 오류:', error);
          // 변환 실패해도 기본 정보는 저장
          const newAnswers = [...answers];
          if (!newAnswers[currentQuestionIndex] || typeof newAnswers[currentQuestionIndex] === 'string') {
            newAnswers[currentQuestionIndex] = [];
          }
          if (!Array.isArray(newAnswers[currentQuestionIndex])) {
            newAnswers[currentQuestionIndex] = [newAnswers[currentQuestionIndex]];
          }
          
          const answerData = {
            audioBlob: audioBlob,
            audioUrl: audioUrl,
            duration: finalDuration,
            mimeType: blobType,
            attempt: currentAttempt,
          };
          
          newAnswers[currentQuestionIndex][currentAttempt - 1] = answerData;
          setAnswers(newAnswers);
          
          // 시도 횟수 업데이트 (완료된 시도 횟수)
          // ref에서 최신 currentAttempt 값 가져오기 (클로저 문제 해결)
          const latestAttempt = currentAttemptRef.current;
          const completedAttempt = Math.min(Math.max(latestAttempt, 1), 2); // 1~2 범위로 제한
          console.log(`✅ ${currentQuestionIndex + 1}번 질문 ${completedAttempt}차 답변 완료`);
          const newAttempts = [...answerAttempts];
          newAttempts[currentQuestionIndex] = completedAttempt;
          setAnswerAttempts(newAttempts);
          console.log(`📊 업데이트된 시도 횟수:`, newAttempts);
          
          // 답변 완료 상태 업데이트
          const newCompleted = [...answerCompleted];
          newCompleted[currentQuestionIndex] = true;
          setAnswerCompleted(newCompleted);
          
          // 2번 시도했으면 다음 시도 불가
          if (completedAttempt >= 2) {
            setCurrentAttempt(2);
          }
        };
        reader.readAsDataURL(audioBlob);
        
        audioChunksRef.current = [];
      };

      // 녹음 시작 (더 짧은 간격으로 데이터 수집하여 품질 향상)
      try {
        recorder.start(50); // timeslice를 50ms로 설정 (더 자주 데이터 수집)
        console.log('✅ 녹음 시작됨');
        setMediaRecorder(recorder);
        setIsRecording(true);
        
        // 답변 타이머 시작 (난이도별 차등 적용) - "답변 시작" 버튼을 눌렀을 때만 시작
        if (timeLeft === null) {
          // 난이도별 시간 제한: 초급 120초, 중급 90초, 고급 60초
          let timeLimit = 90; // 기본값 (중급)
          if (difficulty === 'easy') {
            timeLimit = 120; // 초급: 2분
          } else if (difficulty === 'medium') {
            timeLimit = 90; // 중급: 1분 30초
          } else if (difficulty === 'hard') {
            timeLimit = 60; // 고급: 1분
          }
          console.log(`⏱️ 답변 타이머 시작: ${timeLimit}초 (난이도: ${difficulty})`);
          setTimeLeft(timeLimit);
        }
        
        // 녹음 시간 초기화
        setRecordingTime(0);
        finalRecordingTimeRef.current = 0;
        
        // 녹음 시간 측정
        recordingTimerRef.current = setInterval(() => {
          setRecordingTime(prev => {
            const newTime = prev + 1;
            finalRecordingTimeRef.current = newTime; // 실시간으로 ref에도 저장
            return newTime;
          });
        }, 1000);
      } catch (startError) {
        console.error('❌ recorder.start() 오류:', startError);
        throw startError;
      }
    } catch (error) {
      console.error('❌ 녹음 시작 오류:', error);
      setIsRecording(false);
      
      let errorMessage = '녹음을 시작할 수 없습니다.';
      if (error.name === 'NotSupportedError') {
        errorMessage = '이 브라우저에서 녹음 기능을 지원하지 않습니다. Chrome, Edge, Firefox 최신 버전을 사용해주세요.';
      } else if (error.name === 'InvalidStateError') {
        errorMessage = '녹음기가 이미 실행 중이거나 준비되지 않았습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message) {
        errorMessage = `녹음 오류: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  const startAudioLevelMonitoring = () => {
    if (!analyserRef.current) return;
    
    // 기존 애니메이션 프레임 취소
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    let smoothedLevel = 0; // 부드러운 레벨 추적을 위한 변수
    
    const updateAudioLevel = () => {
      // analyserRef를 직접 체크 (클로저 문제 방지)
      if (!analyserRef.current) {
        setAudioLevel(0);
        setAudioData(new Uint8Array(0));
        return;
      }
      
      // 실시간으로 오디오 데이터 가져오기
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // 실시간 오디오 데이터 저장 (웨이브 효과용) - 새로운 배열로 복사
      const newAudioData = new Uint8Array(dataArray);
      setAudioData(newAudioData);
      
      // 디버깅: 오디오 데이터가 업데이트되는지 확인 (주석 처리 가능)
      // if (newAudioData.length > 0 && Math.random() < 0.01) { // 1% 확률로만 로그
      //   console.log('🎵 오디오 데이터 업데이트:', {
      //     length: newAudioData.length,
      //     maxValue: Math.max(...Array.from(newAudioData)),
      //     avgValue: Array.from(newAudioData).reduce((a, b) => a + b, 0) / newAudioData.length
      //   });
      // }
      
      // RMS (Root Mean Square) 방식으로 더 정확한 레벨 계산
      let sumSquares = 0;
      let maxValue = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i];
        sumSquares += value * value;
        if (value > maxValue) maxValue = value;
      }
      const rms = Math.sqrt(sumSquares / dataArray.length);
      
      // 0-100 범위로 정규화 (더 민감하게, 최대값도 고려)
      const normalizedLevel = Math.min(100, (rms / 255) * 100 * 2.0 + (maxValue / 255) * 20);
      
      // 부드러운 전환을 위한 지수 이동 평균 (EMA) - 더 빠른 반응
      smoothedLevel = smoothedLevel * 0.6 + normalizedLevel * 0.4;
      
      setAudioLevel(Math.round(smoothedLevel));
      
      // 계속 업데이트
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
  };

  const stopAudioLevelMonitoring = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAudioLevel(0);
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      // 타이머를 중지하기 전에 현재 녹음 시간을 저장
      finalRecordingTimeRef.current = recordingTime;
      
      mediaRecorder.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      // 오디오 레벨 모니터링 중지
      stopAudioLevelMonitoring();
      
      // 답변 완료 시 타이머 중지 (시간이 계속 가지 않도록)
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    // 현재 질문의 답변이 완료되었는지 확인 (답변 완료 버튼을 눌렀는지 확인)
    const isCurrentAnswerCompleted = answerCompleted[currentQuestionIndex] === true;
    
    // 답변이 완료되지 않았으면 다음으로 넘어갈 수 없음
    if (!isCurrentAnswerCompleted) {
      alert('답변을 완료해주세요. "답변 시작" 버튼을 눌러 답변을 녹음한 후 "답변 완료" 버튼을 눌러주세요.');
      return;
    }
    
    // 녹음 중이면 먼저 중지
    if (isRecording) {
      stopRecording();
    }
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setRecordingTime(0);
    } else {
      // 모든 답변을 텍스트로 변환 (오디오를 텍스트로 변환하는 API 호출 필요)
      // 현재는 오디오 데이터를 그대로 전달
      // 답변 데이터 변환 (배열인 경우 마지막 답변 사용, 또는 첫 번째 답변)
      const processedAnswers = answers.map((a, index) => {
        if (!a) return null;
        if (Array.isArray(a)) {
          // 배열인 경우 마지막 답변(최신 답변) 사용
          const lastAnswer = a[a.length - 1];
          if (lastAnswer?.base64Audio) {
            return {
              type: 'audio',
              base64Audio: lastAnswer.base64Audio,
              mimeType: lastAnswer.mimeType || 'audio/webm',
              duration: lastAnswer.duration || 0,
              attempt: lastAnswer.attempt || 1,
              audioUrl: lastAnswer.audioUrl || null
            };
          }
          return lastAnswer?.audioUrl || null;
        }
        // 객체인 경우
        if (a.base64Audio) {
          return {
            type: 'audio',
            base64Audio: a.base64Audio,
            mimeType: a.mimeType || 'audio/webm',
            duration: a.duration || 0,
            audioUrl: a.audioUrl || null
          };
        }
        return a.audioUrl || '';
      });
      
      navigate('/feedback', {
        state: { 
          questions, 
          answers: processedAnswers,
          job, 
          difficulty, 
          mode, 
          companyName,
          interviewType: 'video'
        },
      });
    }
  };

  if (!isStarted) {
    // 질문이 이미 있으면 바로 시작
    if (questions.length > 0) {
      startInterview();
      return null;
    }
    
    return (
      <div className="video-interview-page">
        <h1>비디오 면접 설정</h1>
        <div className="form-section">
          {companyName && (
            <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 'var(--radius-md)' }}>
              <strong>기업:</strong> {companyName} | <strong>직무:</strong> {job}
            </div>
          )}
          <div className="form-group">
            <label>직무 선택 *</label>
            <div className="job-selector-grid">
              {[
                { id: 'frontend', name: '프론트엔드 개발자', icon: '💻' },
                { id: 'backend', name: '백엔드 개발자', icon: '⚙️' },
                { id: 'fullstack', name: '풀스택 개발자', icon: '🔧' },
                { id: 'mobile', name: '모바일 개발자', icon: '📱' },
                { id: 'data-scientist', name: '데이터 사이언티스트', icon: '📊' },
                { id: 'ai-ml', name: 'AI/ML 엔지니어', icon: '🤖' },
                { id: 'devops', name: '데브옵스 엔지니어', icon: '☁️' },
                { id: 'ui-ux', name: 'UI/UX 디자이너', icon: '🎨' },
                { id: 'pm', name: '프로덕트 매니저', icon: '📋' },
                { id: 'qa', name: 'QA 엔지니어', icon: '✅' },
                { id: 'security', name: '보안 엔지니어', icon: '🔒' },
                { id: 'cloud', name: '클라우드 엔지니어', icon: '🌐' },
                { id: 'blockchain', name: '블록체인 개발자', icon: '⛓️' },
                { id: 'game', name: '게임 개발자', icon: '🎮' },
                { id: 'embedded', name: '임베디드 개발자', icon: '🔌' },
                { id: 'system', name: '시스템 엔지니어', icon: '🖥️' },
                { id: 'network', name: '네트워크 엔지니어', icon: '🌍' },
                { id: 'data-engineer', name: '데이터 엔지니어', icon: '💾' },
              ].map((jobOption) => (
                <button
                  key={jobOption.id}
                  type="button"
                  className={`job-card ${job === jobOption.name ? 'selected' : ''}`}
                  onClick={() => {
                    setJob(jobOption.name);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1.25rem',
                    border: `2px solid ${job === jobOption.name ? 'var(--primary-color)' : 'var(--border-color)'}`,
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: job === jobOption.name ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-primary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontSize: '1.5rem',
                    minHeight: '100px',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={(e) => {
                    if (job !== jobOption.name) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (job !== jobOption.name) {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }
                  }}
                >
                  <span style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{jobOption.icon}</span>
                  <span style={{ 
                    fontSize: '0.9rem', 
                    fontWeight: job === jobOption.name ? 600 : 500,
                    color: 'var(--text-primary)',
                    textAlign: 'center',
                    lineHeight: '1.3'
                  }}>
                    {jobOption.name}
                  </span>
                  {job === jobOption.name && (
                    <div style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      width: '24px',
                      height: '24px',
                      backgroundColor: 'var(--primary-color)',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
            {job && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--primary-color)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem'
              }}>
                <span style={{ 
                  color: 'var(--text-primary)', 
                  fontWeight: 500,
                  fontSize: '0.95rem'
                }}>
                  선택된 직무: <strong>{job}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setJob('')}
                  style={{
                    padding: '0.25rem 0.75rem',
                    backgroundColor: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
                    e.currentTarget.style.borderColor = 'var(--text-secondary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                  }}
                >
                  변경
                </button>
              </div>
            )}
          </div>
          <div className="form-group">
            <label>난이도</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
              <option value="easy">초급</option>
              <option value="medium">중급</option>
              <option value="hard">고급</option>
            </select>
          </div>
          <div className="form-group">
            <label>모드</label>
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="practice">연습 모드</option>
              <option value="real">실전 모드</option>
            </select>
          </div>
          <div className="form-group">
            <label>질문 개수</label>
            <input
              type="number"
              min="1"
              max="3"
              value={questionCount}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (isNaN(value)) {
                  return;
                }
                if (value < 1) {
                  alert('질문 개수는 최소 1개 이상이어야 합니다.');
                  setQuestionCount(1);
                  return;
                }
                if (value > 3) {
                  alert('질문 개수는 최대 3개까지만 선택할 수 있습니다.');
                  setQuestionCount(3);
                  return;
                }
                setQuestionCount(value);
              }}
            />
            <small style={{ display: 'block', marginTop: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              질문 개수는 1개부터 3개까지 선택 가능합니다.
            </small>
          </div>
          <button onClick={startInterview} className="btn btn-primary" disabled={!job}>
            면접 시작
          </button>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 안내 메시지 표시
  if (authLoading) {
    return (
      <div className="video-interview-page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="video-interview-page">
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          backgroundColor: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--border-color)',
          maxWidth: '600px',
          margin: '2rem auto'
        }}>
          <h1 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
            🔒 로그인이 필요합니다
          </h1>
          <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
            영상 면접을 시작하려면 로그인이 필요합니다.<br />
            로그인 후 다시 시도해주세요.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button 
              onClick={() => navigate('/login', { state: { from: '/video-interview' } })}
              className="btn btn-primary"
            >
              로그인하기
            </button>
            <button 
              onClick={() => navigate('/signup')}
              className="btn btn-secondary"
            >
              회원가입하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentAnswer = answers[currentQuestionIndex];
  const currentAttemptCount = answerAttempts[currentQuestionIndex] || 0;
  // currentAttemptCount는 완료된 시도 횟수 (0=시도 안함, 1=1차 완료, 2=2차 완료)
  const canRetry = currentAttemptCount < 2; // 최대 2번까지 시도 가능 (0 또는 1일 때만 true)
  const hasReachedMaxAttempts = currentAttemptCount >= 2; // 2번 시도 완료
  const canStartNewAttempt = currentAttemptCount < 2; // 새 시도 가능 여부
  const isCurrentAnswerCompleted = answerCompleted[currentQuestionIndex] === true;
  
  // 현재 답변 데이터 가져오기 (배열인 경우 마지막 답변 사용)
  const getCurrentAnswerData = () => {
    if (!currentAnswer) return null;
    if (Array.isArray(currentAnswer)) {
      return currentAnswer[currentAnswer.length - 1] || null;
    }
    return currentAnswer;
  };
  
  const currentAnswerData = getCurrentAnswerData();
  const hasAnswer = currentAnswerData && currentAnswerData.audioUrl;

  return (
    <div className="video-interview-page">
      <div className="video-interview-container">
        <div className="video-section" style={{ position: 'relative' }}>
          <video ref={videoRef} autoPlay muted className="video-preview" />
          {isRecording && (
            <div style={{
              position: 'absolute',
              top: '1rem',
              right: '1rem',
              backgroundColor: 'rgba(239, 68, 68, 0.9)',
              color: 'white',
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: 'bold',
              zIndex: 10
            }}>
              <span style={{
                width: '12px',
                height: '12px',
                backgroundColor: 'white',
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }}></span>
              녹음 중: {formatTime(recordingTime)}
            </div>
          )}
          
          {/* 웨이브 그래프만 표시 - 작고 덜 눈에 띄게 */}
          {isRecording && (
            <div style={{
              position: 'absolute',
              bottom: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '70%',
              maxWidth: '300px',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              padding: '0.4rem 0.6rem',
              borderRadius: 'var(--radius-sm)',
              zIndex: 10,
              backdropFilter: 'blur(2px)'
            }}>
              {/* 웨이브 효과 - 실시간 오디오 데이터 사용 */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1px',
                height: '35px',
                padding: '0 0.15rem'
              }} key={`wave-container-${audioLevel}-${audioData.length}`}>
                {Array.from({ length: 30 }).map((_, i) => {
                  // 실시간 오디오 데이터를 사용하여 각 주파수 대역별 높이 계산
                  let barHeight = 2;
                  let intensity = 0;
                  
                  if (audioData.length > 0) {
                    // 각 바에 해당하는 주파수 대역 인덱스 계산
                    const dataIndex = Math.floor((i / 30) * audioData.length);
                    const value = audioData[dataIndex] || 0;
                    
                    // 인접한 데이터 포인트들의 평균으로 부드럽게 (더 넓은 범위)
                    const range = Math.max(1, Math.floor(audioData.length / 30));
                    let sum = 0;
                    let count = 0;
                    for (let j = Math.max(0, dataIndex - range); j <= Math.min(audioData.length - 1, dataIndex + range); j++) {
                      sum += audioData[j] || 0;
                      count++;
                    }
                    const avgValue = count > 0 ? sum / count : value;
                    
                    // intensity 계산 (더 민감하게)
                    intensity = avgValue / 255;
                    
                    // 오디오 레벨이 낮으면 intensity도 낮춤 (하지만 완전히 멈추지는 않음)
                    if (audioLevel <= 5) {
                      intensity = intensity * 0.1; // 매우 낮은 레벨일 때는 거의 움직이지 않음
                    } else if (audioLevel <= 10) {
                      intensity = intensity * 0.4; // 낮은 레벨일 때는 약간 움직임
                    } else {
                      // 정상 레벨일 때는 그대로 사용
                      intensity = Math.min(1, intensity * 1.2); // 약간 증폭
                    }
                    
                    // 높이 계산 (최소 2px, 최대 32px) - 더 작고 덜 눈에 띄게
                    barHeight = Math.max(2, Math.min(32, 2 + (intensity * 30)));
                  } else {
                    // audioData가 없을 때는 audioLevel을 사용하여 웨이브 표시
                    if (audioLevel > 5) {
                      // 각 바마다 약간 다른 높이를 주어 웨이브 효과
                      const waveOffset = Math.sin((i / 30) * Math.PI * 2 + Date.now() / 200) * 0.3 + 0.7;
                      intensity = (audioLevel / 100) * waveOffset;
                      barHeight = Math.max(2, Math.min(32, 2 + (intensity * 30)));
                    } else {
                      barHeight = 2;
                      intensity = 0;
                    }
                  }
                  
                  // 색상 계산 (부드러운 주황색 계열, 매우 덜 눈에 띄게)
                  const hue = 25 + (intensity * 10); // 25-35 (부드러운 주황색)
                  const saturation = 50 + (intensity * 15); // 50-65% (더 덜 진하게)
                  const lightness = 60 + (intensity * 10); // 60-70% (더 밝게)
                  
                  return (
                    <div
                      key={i}
                      style={{
                        width: '2px',
                        height: `${barHeight}px`,
                        backgroundColor: intensity > 0.05 
                          ? `hsla(${hue}, ${saturation}%, ${lightness}%, 0.65)`
                          : 'rgba(251, 191, 36, 0.25)', // 주황색 계열
                        borderRadius: '1px',
                        transition: 'none',
                        alignSelf: 'flex-end',
                        boxShadow: intensity > 0.3 
                          ? `0 0 ${intensity * 4}px hsla(${hue}, ${saturation}%, ${lightness}%, 0.4)`
                          : 'none',
                        willChange: 'height, background-color'
                      }}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="question-section">
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <h2 style={{ margin: 0, flex: 1 }}>{questions[currentQuestionIndex]?.text}</h2>
              {timeLeft !== null && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  backgroundColor: timeLeft <= 10 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 'var(--radius-md)',
                  border: `2px solid ${timeLeft <= 10 ? '#ef4444' : '#6366f1'}`,
                  fontWeight: 'bold',
                  color: timeLeft <= 10 ? '#ef4444' : '#6366f1',
                  marginLeft: '1rem'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>⏱️</span>
                  <span style={{ 
                    fontSize: '1.1rem',
                    minWidth: '60px'
                  }}>
                    {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                  </span>
                  <span style={{ fontSize: '0.85rem', opacity: 0.8 }}>
                    ({difficulty === 'easy' ? '초급' : difficulty === 'medium' ? '중급' : '고급'})
                  </span>
                </div>
              )}
            </div>
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '1rem',
              flexWrap: 'wrap',
              gap: '0.5rem'
            }}>
              <div style={{ 
                fontSize: '0.9rem', 
                color: 'var(--text-secondary)'
              }}>
                질문 {currentQuestionIndex + 1} / {questions.length}
              </div>
              {job && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'rgba(99, 102, 241, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--primary-color)',
                  fontWeight: 500
                }}>
                  <span>💼</span>
                  <span>{job}</span>
                </div>
              )}
            </div>
            {timeLeft !== null && (() => {
              // 난이도별 최대 시간 계산: 초급 120초, 중급 90초, 고급 60초
              const maxTime = difficulty === 'easy' ? 120 : difficulty === 'medium' ? 90 : 60;
              return (
                <div style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: 'rgba(0, 0, 0, 0.1)',
                  borderRadius: '2px',
                  marginBottom: '1rem',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${(timeLeft / maxTime) * 100}%`,
                    height: '100%',
                    backgroundColor: timeLeft <= 10 ? '#ef4444' : '#6366f1',
                    transition: 'width 1s linear, background-color 0.3s ease',
                    borderRadius: '2px'
                  }}></div>
                </div>
              );
            })()}
            
            {/* 답변 시도 횟수 표시 */}
            <div style={{
              marginBottom: '1rem',
              padding: '0.75rem 1rem',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--primary-color)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                답변 기회: {isRecording ? currentAttempt : currentAttemptCount}/2
              </span>
              {!isRecording && currentAttemptCount > 0 && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {currentAttemptCount === 1 ? '1차 답변 완료' : '2차 답변 완료'}
                </span>
              )}
              {isRecording && (
                <span style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                  {currentAttempt}차 답변 녹음 중...
                </span>
              )}
            </div>
          </div>

          {/* 답변 상태 표시 */}
          {isCurrentAnswerCompleted && !isRecording && currentAnswerData && (
            <div style={{
              padding: '1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid var(--success-color)',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '1.2rem', marginRight: '0.5rem' }}>✅</span>
              <strong>{currentAttemptCount}차 답변이 녹음되었습니다</strong>
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                녹음 시간: {formatTime(currentAnswerData.duration || 0)}
              </div>
              {canStartNewAttempt && currentAttemptCount < 2 && (
                <button
                  onClick={async () => {
                    // 엄격한 체크: 2번 시도 완료 시 더 이상 불가
                    if (currentAttemptCount >= 2) {
                      alert('답변 기회를 모두 사용했습니다. (최대 2회)');
                      return;
                    }
                    // 다음 시도가 2를 초과하면 불가
                    const nextAttempt = currentAttemptCount + 1;
                    if (nextAttempt > 2) {
                      alert('답변 기회를 모두 사용했습니다. (최대 2회)');
                      return;
                    }
                    // nextAttempt는 1 또는 2만 가능 (엄격한 체크)
                    if (nextAttempt < 1 || nextAttempt > 2) {
                      console.error('❌ 잘못된 시도 횟수:', nextAttempt);
                      return;
                    }
                    // 녹음 시작 전에 currentAttempt 설정
                    const attemptValue = Math.min(nextAttempt, 2);
                    setCurrentAttempt(attemptValue); // 최대 2로 제한
                    currentAttemptRef.current = attemptValue; // ref도 업데이트
                    // 난이도별 시간 제한: 초급 120초, 중급 90초, 고급 60초
                    let timeLimit = 90; // 기본값 (중급)
                    if (difficulty === 'easy') {
                      timeLimit = 120; // 초급: 2분
                    } else if (difficulty === 'medium') {
                      timeLimit = 90; // 중급: 1분 30초
                    } else if (difficulty === 'hard') {
                      timeLimit = 60; // 고급: 1분
                    }
                    setTimeLeft(timeLimit); // 타이머 리셋
                    await startRecording();
                  }}
                  className="btn btn-secondary"
                  style={{
                    marginTop: '0.75rem',
                    fontSize: '0.9rem',
                    padding: '0.5rem 1rem'
                  }}
                >
                  다시 답변하기 ({currentAttemptCount + 1}차)
                </button>
              )}
            </div>
          )}

          {/* 답변 시작/중지 버튼 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center' }}>
            {hasReachedMaxAttempts && !isRecording ? (
              // 2번 시도 완료 시 메시지 표시
              <div style={{
                padding: '1rem 2rem',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                border: '2px solid #ef4444',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                color: '#ef4444',
                fontWeight: 'bold'
              }}>
                ⚠️ 답변 기회를 모두 사용했습니다 (최대 2회)
              </div>
            ) : !isRecording ? (
              // 답변 시작 버튼 (1차 답변만 가능, 2차는 "다시 답변하기" 버튼 사용)
              canStartNewAttempt && currentAttemptCount === 0 && (
                <button 
                  onClick={async () => {
                    // 녹음 시작 전에 currentAttempt 설정
                    setCurrentAttempt(1);
                    currentAttemptRef.current = 1;
                    await startRecording();
                  }} 
                  className="btn btn-primary"
                  style={{ 
                    fontSize: '1.2rem', 
                    padding: '1rem 2rem',
                    minWidth: '200px',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>🎤</span>
                  답변 시작
                </button>
              )
            ) : (
              <button 
                onClick={stopRecording} 
                className="btn btn-danger"
                style={{ 
                  fontSize: '1.2rem', 
                  padding: '1rem 2rem',
                  minWidth: '200px',
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>⏹️</span>
                답변 완료
              </button>
            )}
            
            {!hasAnswer && !isRecording && (
              <p style={{ 
                color: 'var(--text-secondary)', 
                fontSize: '0.9rem',
                textAlign: 'center',
                marginTop: '0.5rem'
              }}>
                "답변 시작" 버튼을 눌러 음성으로 답변해주세요
              </p>
            )}
            
            {!streamReady && (
              <p style={{ 
                color: 'var(--warning-color)', 
                fontSize: '0.85rem',
                textAlign: 'center',
                marginTop: '0.5rem'
              }}>
                ⚠️ 카메라/마이크 접근 권한을 확인 중... 버튼을 클릭하면 권한 요청이 다시 표시됩니다.
              </p>
            )}
          </div>
        </div>
        <div className="interview-controls">
          <button
            onClick={() => {
              if (isRecording) stopRecording();
              setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
              setRecordingTime(0);
            }}
            disabled={currentQuestionIndex === 0 || isRecording}
            className="btn btn-secondary"
          >
            이전
          </button>
          <span>
            {currentQuestionIndex + 1} / {questions.length}
          </span>
          <button 
            onClick={handleNext} 
            className="btn btn-primary"
            disabled={!isCurrentAnswerCompleted}
          >
            {currentQuestionIndex === questions.length - 1 ? '완료' : '다음'}
          </button>
        </div>
      </div>
      
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.2); }
        }
      `}</style>
    </div>
  );
};

export default VideoInterview;

