package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.FeeStatusResponse;
import com.arnav.tutionSAAS.dto.InviteResponse;
import com.arnav.tutionSAAS.entity.Role;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.UserRepo;
import com.arnav.tutionSAAS.service.AdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired private AdminService adminService;
    @Autowired private UserRepo userRepo;
    @Autowired private com.arnav.tutionSAAS.service.BatchService batchService;

    // ─── Teacher Invites (link-only, no email) ───

    @PostMapping("/invites")
    public ResponseEntity<InviteResponse> generateInvite() {
        return ResponseEntity.ok(adminService.generateTeacherInvite());
    }

    @GetMapping("/invites")
    public ResponseEntity<List<InviteResponse>> getAllInvites() {
        return ResponseEntity.ok(adminService.getAllInvites());
    }

    // ─── User Listing (for dropdowns) ───

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> getUsersByRole(@RequestParam String role) {
        Role r = Role.valueOf(role.toUpperCase());
        List<User> users = userRepo.findByRole(r);
        List<Map<String, Object>> result = users.stream().map(u -> Map.<String, Object>of(
                "id", u.getId(),
                "fullName", u.getFullName() != null ? u.getFullName() : "",
                "email", u.getEmail() != null ? u.getEmail() : "",
                "grade", u.getGrade() != null ? u.getGrade() : ""
        )).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> forceDeleteUser(@PathVariable Long id) {
        User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        userService.deleteUserByClerkId(user.getClerkId());
        return ResponseEntity.noContent().build();
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

    // ─── Batch Deletion ───

    @DeleteMapping("/batches/{id}")
    public ResponseEntity<Void> deleteBatch(@PathVariable Long id) {
        batchService.deleteBatch(id);
        return ResponseEntity.noContent().build();
    }

    // ─── Dashboard ───

    @GetMapping("/dashboard")
    public ResponseEntity<AdminService.DashboardStats> getDashboard() {
        return ResponseEntity.ok(adminService.getDashboardStats());
    }

    // ─── Join Requests ───

    @GetMapping("/join-requests")
    public ResponseEntity<List<com.arnav.tutionSAAS.dto.JoinRequestResponse>> getJoinRequests() {
        return ResponseEntity.ok(batchService.getPendingJoinRequests());
    }

    @PostMapping("/join-requests/{id}/approve")
    public ResponseEntity<Void> approveJoinRequest(@PathVariable Long id) {
        batchService.approveJoinRequest(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/join-requests/{id}/reject")
    public ResponseEntity<Void> rejectJoinRequest(@PathVariable Long id) {
        batchService.rejectJoinRequest(id);
        return ResponseEntity.noContent().build();
    }
}

