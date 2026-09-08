package com.cinemind.controller;

import com.cinemind.common.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/health")
public class HealthController {

    @GetMapping("/live")
    public ResponseEntity<ApiResponse<Map<String, String>>> liveness() {
        return ResponseEntity.ok(ApiResponse.of(Map.of("status", "UP", "component", "cinemind-server")));
    }

    @GetMapping("/ready")
    public ResponseEntity<ApiResponse<Map<String, String>>> readiness() {
        return ResponseEntity.ok(ApiResponse.of(Map.of("status", "UP", "database", "CONNECTED")));
    }
}
