package com.example.interview_ai.model;

import lombok.*;

@Getter @Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Answer {
    private int qno;          // 어떤 질문(qno)에 대한 답변인지 매핑
    private String text;      // 사용자의 답변 텍스트
    private Integer durationSec; // (선택) 답변에 걸린 시간(초) - 향후 음성 기능 대비
}
