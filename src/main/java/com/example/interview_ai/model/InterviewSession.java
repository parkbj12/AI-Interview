package com.example.interview_ai.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.List;

@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "interview_sessions")
@CompoundIndex(name = "job_created_idx", def = "{'job': 1, 'createdAt': -1}")
public class InterviewSession {

    @Id
    private String id;              // 세션 ID

    private String job;             // 선택한 직군 (예: "백엔드 개발자")

    private List<Question> questions;  // 생성된 질문 리스트
    private List<Answer> answers;      // 사용자가 입력한 답변 리스트

    private Feedback feedback;      // AI 피드백 (세션 종료 후 채워짐)

    @CreatedDate
    private Instant createdAt;      // 생성 시각(자동)
}
