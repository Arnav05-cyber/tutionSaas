package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.LinkedStudentResponse;
import com.arnav.tutionSAAS.dto.ParentLinkRequest;
import com.arnav.tutionSAAS.entity.StudentProfile;
import com.arnav.tutionSAAS.service.AttendanceService;
import com.arnav.tutionSAAS.service.ParentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/parent")
@PreAuthorize("hasRole('PARENT')")
public class ParentController {

    @Autowired private ParentService parentService;

    /**
     * Parent uses the 6-char code from their child to link accounts.
     */
    @PostMapping("/link")
    public ResponseEntity<Void> linkToStudent(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody ParentLinkRequest request) {
        parentService.linkToStudent(jwt.getSubject(), request.getLinkCode());
        return ResponseEntity.noContent().build();
    }

    /**
     * Returns all students linked to this parent with fee and blocked status.
     */
    @GetMapping("/students")
    public ResponseEntity<List<LinkedStudentResponse>> getLinkedStudents(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(parentService.getLinkedStudents(jwt.getSubject()));
    }

    /**
     * Returns attendance summary for a linked student in a specific batch.
     */
    @GetMapping("/students/{studentId}/attendance")
    public ResponseEntity<AttendanceService.AttendanceSummary> getStudentAttendance(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long studentId,
            @RequestParam Long batchId) {
        return ResponseEntity.ok(parentService.getStudentAttendance(jwt.getSubject(), studentId, batchId));
    }

    /**
     * Returns fee status for a linked student.
     */
    @GetMapping("/students/{studentId}/fees")
    public ResponseEntity<Map<String, Object>> getStudentFeeStatus(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long studentId) {
        StudentProfile profile = parentService.getStudentFeeStatus(jwt.getSubject(), studentId);
        return ResponseEntity.ok(Map.of(
                "studentId", studentId,
                "feesPaidForCurrentMonth", profile.isFeesPaidForCurrentMonth()
        ));
    }
}
