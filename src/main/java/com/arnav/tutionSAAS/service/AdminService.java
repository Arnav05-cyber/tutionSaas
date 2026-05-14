package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.FeeStatusResponse;
import com.arnav.tutionSAAS.dto.InviteRequest;
import com.arnav.tutionSAAS.dto.InviteResponse;
import com.arnav.tutionSAAS.entity.*;
import com.arnav.tutionSAAS.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired private UserRepo userRepo;
    @Autowired private StudentRepo studentRepo;
    @Autowired private TeacherInviteRepo inviteRepo;
    @Autowired private BatchRepo batchRepo;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    // ─── Teacher Invite ───

    @Transactional
    public InviteResponse generateTeacherInvite(InviteRequest request) {
        TeacherInvite invite = new TeacherInvite();
        invite.setToken(UUID.randomUUID().toString());
        invite.setEmail(request != null ? request.getEmail() : null);
        invite.setUsed(false);
        invite.setCreatedAt(LocalDateTime.now());
        invite.setExpiresAt(LocalDateTime.now().plusDays(7));

        TeacherInvite saved = inviteRepo.save(invite);
        return toInviteResponse(saved);
    }

    public List<InviteResponse> getAllInvites() {
        return inviteRepo.findAll().stream()
                .map(this::toInviteResponse)
                .collect(Collectors.toList());
    }

    // ─── Fee Management ───

    public List<FeeStatusResponse> getAllFeeStatus() {
        return userRepo.findByRole(Role.STUDENT).stream()
                .map(student -> {
                    FeeStatusResponse dto = new FeeStatusResponse();
                    dto.setStudentId(student.getId());
                    dto.setStudentName(student.getFullName());
                    dto.setEmail(student.getEmail());
                    dto.setGrade(student.getGrade());
                    dto.setBlocked(student.isBlocked());

                    StudentProfile profile = studentRepo.findById(student.getId()).orElse(null);
                    dto.setFeesPaid(profile != null && profile.isFeesPaidForCurrentMonth());

                    List<String> batchNames = batchRepo.findByStudents_Id(student.getId())
                            .stream().map(Batch::getName).collect(Collectors.toList());
                    dto.setBatchNames(batchNames);

                    return dto;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public void blockStudent(Long studentId) {
        User user = userRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        if (user.getRole() != Role.STUDENT) {
            throw new RuntimeException("Can only block student accounts");
        }
        user.setBlocked(true);
        userRepo.save(user);
    }

    @Transactional
    public void unblockStudent(Long studentId) {
        User user = userRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        user.setBlocked(false);
        userRepo.save(user);
    }

    @Transactional
    public void setMonthlyFee(Long batchId, double amount) {
        Batch batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        if (amount < 0) throw new RuntimeException("Fee amount cannot be negative");
        batch.setMonthlyFee(amount);
        batchRepo.save(batch);
    }

    // ─── Dashboard ───

    public DashboardStats getDashboardStats() {
        DashboardStats stats = new DashboardStats();
        stats.setTotalStudents(userRepo.findByRole(Role.STUDENT).size());
        stats.setTotalTeachers(userRepo.findByRole(Role.TEACHER).size());
        stats.setTotalParents(userRepo.findByRole(Role.PARENT).size());
        stats.setActiveBatches(batchRepo.findByIsActiveTrue().size());

        long unpaid = userRepo.findByRole(Role.STUDENT).stream()
                .filter(s -> {
                    StudentProfile p = studentRepo.findById(s.getId()).orElse(null);
                    return p == null || !p.isFeesPaidForCurrentMonth();
                }).count();
        stats.setUnpaidFeesCount(unpaid);

        long blocked = userRepo.findByRole(Role.STUDENT).stream()
                .filter(User::isBlocked).count();
        stats.setBlockedStudentsCount(blocked);

        return stats;
    }

    // ─── Helpers ───

    private InviteResponse toInviteResponse(TeacherInvite invite) {
        InviteResponse dto = new InviteResponse();
        dto.setId(invite.getId());
        dto.setToken(invite.getToken());
        dto.setInviteUrl(frontendUrl + "/signup?invite=" + invite.getToken());
        dto.setEmail(invite.getEmail());
        dto.setUsed(invite.isUsed());
        dto.setExpiresAt(invite.getExpiresAt());
        dto.setCreatedAt(invite.getCreatedAt());
        return dto;
    }

    // ─── Inner class for dashboard ───

    @lombok.Data
    public static class DashboardStats {
        private long totalStudents;
        private long totalTeachers;
        private long totalParents;
        private long activeBatches;
        private long unpaidFeesCount;
        private long blockedStudentsCount;
    }
}
