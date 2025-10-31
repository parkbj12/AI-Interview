package com.example.interview_ai.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Answer {
    private int questionId;     // 질문 번호
    private String content;     // 사용자의 답변
    private Instant createdAt;  // 답변 작성 시간
}
