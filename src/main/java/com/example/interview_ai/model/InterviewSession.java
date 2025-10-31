package com.example.interview_ai.model;

import lombok.*;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "interview_sessions")
public class InterviewSession {

    @Id
    private String id;

    private String job;
    private List<Question> questions;

    // ✅ 추가
    private List<Answer> answers;

    private Instant createdAt;
}
