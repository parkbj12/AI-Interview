package com.example.interview_ai;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;

@SpringBootApplication
public class InterviewAiApplication {
    public static void main(String[] args) {
        SpringApplication.run(InterviewAiApplication.class, args);
    }

    @Bean
    CommandLineRunner showMappings(ApplicationContext context) {
        return args -> {
            System.out.println("=== 🔍 Registered Request Mappings ===");
            RequestMappingHandlerMapping mapping = context.getBean(RequestMappingHandlerMapping.class);
            mapping.getHandlerMethods().forEach((k, v) -> System.out.println(k + " -> " + v));
            System.out.println("======================================");
        };
    }
}
