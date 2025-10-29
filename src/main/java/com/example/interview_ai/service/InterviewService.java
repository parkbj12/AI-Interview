package com.example.interview_ai.service;

import com.example.interview_ai.model.Answer;
import com.example.interview_ai.model.InterviewSession;
import com.example.interview_ai.model.Question;
import com.example.interview_ai.repository.InterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class InterviewService {

    private final InterviewSessionRepository interviewSessionRepository;

    // ✅ 직군 목록 반환
    public List<String> getJobList() {
        return List.of("백엔드 개발자", "프론트엔드 개발자", "디자이너", "데이터 분석가", "AI 엔지니어");
    }

    // ✅ 면접 시작 시 기본 질문 생성 및 저장
    public InterviewSession startInterview(String job) {
        List<Question> questions = List.of(
                new Question(1, job + " 관련 첫 번째 질문입니다."),
                new Question(2, job + " 관련 두 번째 질문입니다."),
                new Question(3, job + " 관련 세 번째 질문입니다.")
        );

        InterviewSession session = InterviewSession.builder()
                .id(UUID.randomUUID().toString())
                .job(job)
                .questions(questions)
                .answers(new ArrayList<>()) // 빈 답변 리스트 초기화
                .createdAt(Instant.now())
                .build();

        return interviewSessionRepository.save(session);
    }

    // ✅ 전체 세션 조회
    public List<InterviewSession> getAllSessions() {
        return interviewSessionRepository.findAll();
    }

    // ✅ 특정 세션 조회
    public InterviewSession getSessionById(String id) {
        return interviewSessionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("해당 ID의 면접 세션을 찾을 수 없습니다: " + id));
    }

    // ✅ 답변 저장 기능 추가
    public InterviewSession saveAnswer(String sessionId, Answer answer) {
        InterviewSession session = interviewSessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("세션을 찾을 수 없습니다."));

        if (session.getAnswers() == null) {
            session.setAnswers(new ArrayList<>());
        }

        answer.setCreatedAt(Instant.now());
        session.getAnswers().add(answer);

        return interviewSessionRepository.save(session);
    }
}
