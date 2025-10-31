package com.example.interview_ai.model;

import lombok.*;

@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Feedback {
    private int logic;     // 논리성 (0~100)
    private int clarity;   // 명확성 (0~100)
    private int keyword;   // 키워드 포함도 (0~100)
    private String summary; // 총평 코멘트
}
