package com.example.interview_ai.repository;

import com.example.interview_ai.model.InterviewSession;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface InterviewSessionRepository extends MongoRepository<InterviewSession, String> {
    // 필요 시 커스텀 쿼리 추가 가능 (예: List<InterviewSession> findByJobOrderByCreatedAtDesc(String job);)
}
