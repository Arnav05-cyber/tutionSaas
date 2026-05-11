package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.ClassSessionRequest;
import com.arnav.tutionSAAS.dto.ClassSessionResponse;
import com.arnav.tutionSAAS.service.ClassSessionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ClassSessionController {

    @Autowired private ClassSessionService sessionService;

    @PostMapping("/api/batches/{batchId}/sessions")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ClassSessionResponse> createSession(
            @PathVariable Long batchId,
            @RequestBody ClassSessionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(sessionService.createSession(batchId, request, jwt.getSubject()));
    }

    @GetMapping("/api/batches/{batchId}/sessions")
    public ResponseEntity<List<ClassSessionResponse>> getSessionsForBatch(@PathVariable Long batchId) {
        return ResponseEntity.ok(sessionService.getSessionsForBatch(batchId));
    }

    @PutMapping("/api/sessions/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ClassSessionResponse> updateSession(
            @PathVariable Long id,
            @RequestBody ClassSessionRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(sessionService.updateSession(id, request, jwt.getSubject()));
    }

    @PatchMapping("/api/sessions/{id}/cancel")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ClassSessionResponse> cancelSession(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(sessionService.cancelSession(id, jwt.getSubject()));
    }

    @PatchMapping("/api/sessions/{id}/complete")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ClassSessionResponse> completeSession(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(sessionService.completeSession(id, jwt.getSubject()));
    }

    @GetMapping("/api/sessions/upcoming")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<ClassSessionResponse>> getUpcomingSessions(
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(sessionService.getUpcomingSessionsForStudent(jwt.getSubject()));
    }
}
