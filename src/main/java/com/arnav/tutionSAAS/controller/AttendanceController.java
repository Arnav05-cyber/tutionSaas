package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.AttendanceRequest;
import com.arnav.tutionSAAS.dto.AttendanceResponse;
import com.arnav.tutionSAAS.service.AttendanceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
public class AttendanceController {

    @Autowired private AttendanceService attendanceService;

    @PostMapping("/api/sessions/{sessionId}/attendance")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<AttendanceResponse> markAttendance(
            @PathVariable Long sessionId,
            @RequestBody AttendanceRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(attendanceService.markAttendance(sessionId, request, jwt.getSubject()));
    }

    @GetMapping("/api/sessions/{sessionId}/attendance")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<AttendanceResponse> getAttendance(@PathVariable Long sessionId) {
        return ResponseEntity.ok(attendanceService.getAttendanceForSession(sessionId));
    }

    @GetMapping("/api/batches/{batchId}/students/{studentId}/attendance")
    @PreAuthorize("hasAnyRole('TEACHER', 'ADMIN')")
    public ResponseEntity<AttendanceService.AttendanceSummary> getStudentSummary(
            @PathVariable Long batchId,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(attendanceService.getStudentAttendanceSummary(batchId, studentId));
    }
}
