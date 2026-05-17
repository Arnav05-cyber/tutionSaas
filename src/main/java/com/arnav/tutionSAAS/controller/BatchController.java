package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.BatchRequest;
import com.arnav.tutionSAAS.dto.BatchResponse;
import com.arnav.tutionSAAS.entity.Role;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.UserRepo;
import com.arnav.tutionSAAS.service.BatchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/batches")
public class BatchController {

    @Autowired private BatchService batchService;
    @Autowired private UserRepo userRepo;

    // ─── Admin creates a batch ───

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BatchResponse> createBatch(@RequestBody BatchRequest request) {
        return ResponseEntity.ok(batchService.createBatch(request));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<BatchResponse>> getAllBatches() {
        return ResponseEntity.ok(batchService.getAllBatches());
    }

    // ─── Teacher views their assigned batches ───

    @GetMapping("/my")
    public ResponseEntity<List<BatchResponse>> getMyBatches(@AuthenticationPrincipal Jwt jwt) {
        User user = userRepo.findByClerkId(jwt.getSubject())
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() == Role.TEACHER) {
            return ResponseEntity.ok(batchService.getTeacherBatches(jwt.getSubject()));
        } else {
            return ResponseEntity.ok(batchService.getStudentBatches(jwt.getSubject()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<BatchResponse> getBatch(@PathVariable Long id) {
        return ResponseEntity.ok(batchService.getBatchById(id));
    }

    // ─── Admin manages students in a batch ───

    @PostMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BatchResponse> addStudent(
            @PathVariable Long id,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(batchService.addStudentToBatch(id, studentId));
    }

    @DeleteMapping("/{id}/students/{studentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BatchResponse> removeStudent(
            @PathVariable Long id,
            @PathVariable Long studentId) {
        return ResponseEntity.ok(batchService.removeStudentFromBatch(id, studentId));
    }

    // ─── Admin reassigns teacher ───

    @PutMapping("/{id}/teacher/{teacherId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BatchResponse> assignTeacher(
            @PathVariable Long id,
            @PathVariable Long teacherId) {
        return ResponseEntity.ok(batchService.assignTeacher(id, teacherId));
    }
}
