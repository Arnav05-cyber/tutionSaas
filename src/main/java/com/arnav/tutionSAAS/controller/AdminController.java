package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.FeeStatusResponse;
import com.arnav.tutionSAAS.dto.InviteRequest;
import com.arnav.tutionSAAS.dto.InviteResponse;
import com.arnav.tutionSAAS.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired private AdminService adminService;

    // ─── Teacher Invites ───

    @PostMapping("/invites")
    public ResponseEntity<InviteResponse> generateInvite(@RequestBody(required = false) InviteRequest request) {
        return ResponseEntity.ok(adminService.generateTeacherInvite(request));
    }

    @GetMapping("/invites")
    public ResponseEntity<List<InviteResponse>> getAllInvites() {
        return ResponseEntity.ok(adminService.getAllInvites());
    }

    // ─── Fee Management ───

    @GetMapping("/fees")
    public ResponseEntity<List<FeeStatusResponse>> getAllFeeStatus() {
        return ResponseEntity.ok(adminService.getAllFeeStatus());
    }

    @PutMapping("/students/{id}/block")
    public ResponseEntity<Void> blockStudent(@PathVariable Long id) {
        adminService.blockStudent(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/students/{id}/unblock")
    public ResponseEntity<Void> unblockStudent(@PathVariable Long id) {
        adminService.unblockStudent(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/batches/{id}/fee")
    public ResponseEntity<Void> setMonthlyFee(
            @PathVariable Long id,
            @RequestBody Map<String, Double> body) {
        double amount = body.getOrDefault("monthlyFee", 0.0);
        adminService.setMonthlyFee(id, amount);
        return ResponseEntity.noContent().build();
    }

    // ─── Dashboard ───

    @GetMapping("/dashboard")
    public ResponseEntity<AdminService.DashboardStats> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }
}
