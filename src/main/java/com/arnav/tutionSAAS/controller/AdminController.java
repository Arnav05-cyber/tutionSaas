package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.PayoutResponse;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired private AdminService adminService;

    // ─── Teacher Approval ───

    @GetMapping("/teachers/pending")
    public ResponseEntity<List<User>> getPendingTeachers() {
        return ResponseEntity.ok(adminService.getPendingTeachers());
    }

    @PutMapping("/teachers/{id}/approve")
    public ResponseEntity<User> approveTeacher(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.approveTeacher(id));
    }

    @DeleteMapping("/teachers/{id}/reject")
    public ResponseEntity<Void> rejectTeacher(@PathVariable Long id) {
        adminService.rejectTeacher(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Payout Management ───

    @PostMapping("/payouts/generate")
    public ResponseEntity<PayoutResponse> generatePayout(
            @RequestParam Long teacherId,
            @RequestParam String month) {
        return ResponseEntity.ok(adminService.generatePayout(teacherId, month));
    }

    @PutMapping("/payouts/{id}/pay")
    public ResponseEntity<PayoutResponse> markPaid(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.markPaid(id));
    }

    @GetMapping("/payouts")
    public ResponseEntity<List<PayoutResponse>> getAllPayouts(
            @RequestParam(required = false) String month) {
        return ResponseEntity.ok(adminService.getAllPayouts(month));
    }

    // ─── Dashboard ───

    @GetMapping("/dashboard")
    public ResponseEntity<AdminService.DashboardStats> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }
}
