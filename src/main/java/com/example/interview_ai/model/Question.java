package com.example.interview_ai.model;

import lombok.*;

@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Question {
    private int qno;       // 질문 번호 (1,2,3...)
    private String text;   // 질문 내용
}
