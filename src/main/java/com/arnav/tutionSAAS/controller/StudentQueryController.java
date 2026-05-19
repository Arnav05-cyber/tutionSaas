package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.QueryReplyRequest;
import com.arnav.tutionSAAS.dto.StudentQueryRequest;
import com.arnav.tutionSAAS.dto.StudentQueryResponse;
import com.arnav.tutionSAAS.service.StudentQueryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/queries")
public class StudentQueryController {

    @Autowired private StudentQueryService queryService;

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentQueryResponse> createQuery(
            @RequestBody StudentQueryRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(queryService.createQuery(request, jwt.getSubject()));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<List<StudentQueryResponse>> getMyQueries(
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(queryService.getMyQueries(jwt.getSubject()));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<StudentQueryResponse>> getAllQueries() {
        return ResponseEntity.ok(queryService.getAllQueries());
    }

    @PatchMapping("/{id}/respond")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<StudentQueryResponse> respondToQuery(
            @PathVariable Long id,
            @RequestBody QueryReplyRequest request) {
        return ResponseEntity.ok(queryService.replyToQuery(id, request));
    }
}
