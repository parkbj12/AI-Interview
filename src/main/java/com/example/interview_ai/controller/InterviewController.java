package com.example.interview_ai.controller;

import com.example.interview_ai.model.Answer;
import com.example.interview_ai.model.InterviewSession;
import com.example.interview_ai.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/test")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173") // 프론트와 연결 시 필요
public class InterviewController {

    private final InterviewService interviewService;

    // 직군 목록 조회
    @GetMapping("/jobs")
    public List<String> getJobs() {
        return interviewService.getJobList();
    }

    // 면접 시작
    @PostMapping("/start")
    public InterviewSession startInterview(@RequestParam String job) {
        return interviewService.startInterview(job);
    }

    // ✅ 면접 세션 전체 조회
    @GetMapping("/sessions")
    public List<InterviewSession> getAllSessions() {
        return interviewService.getAllSessions();
    }

    // ✅ 특정 세션 상세조회
    @GetMapping("/sessions/{id}")
    public InterviewSession getSessionById(@PathVariable String id) {
        return interviewService.getSessionById(id);
    }
    @PostMapping("/answer")
    public InterviewSession saveAnswer(@RequestParam String sessionId, @RequestBody Answer answer) {
        return interviewService.saveAnswer(sessionId, answer);
    }

}
