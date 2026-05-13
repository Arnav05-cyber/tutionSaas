package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.PayoutResponse;
import com.arnav.tutionSAAS.entity.*;
import com.arnav.tutionSAAS.repository.*;
import com.arnav.tutionSAAS.util.PayoutMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AdminService {

    @Autowired private UserRepo userRepo;
    @Autowired private TeacherRepo teacherRepo;
    @Autowired private StudentRepo studentRepo;
    @Autowired private ClassSessionRepo sessionRepo;
    @Autowired private PayoutRepo payoutRepo;
    @Autowired private BatchRepo batchRepo;
    @Autowired private PayoutMapper payoutMapper;

    // ─── Teacher Approval ───

    public List<User> getPendingTeachers() {
        return userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.TEACHER && !u.isApproved())
                .collect(Collectors.toList());
    }

    @Transactional
    public User approveTeacher(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.TEACHER) {
            throw new RuntimeException("User is not a teacher");
        }
        user.setApproved(true);
        return userRepo.save(user);
    }

    @Transactional
    public void rejectTeacher(Long userId) {
        User user = userRepo.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() != Role.TEACHER) {
            throw new RuntimeException("User is not a teacher");
        }
        teacherRepo.deleteById(userId);
        userRepo.delete(user);
    }

    // ─── Payout Management ───

    @Transactional
    public PayoutResponse generatePayout(Long teacherId, String month) {
        User teacher = userRepo.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // Check if payout already exists for this month
        if (payoutRepo.findByTeacher_IdAndMonth(teacherId, month).isPresent()) {
            throw new RuntimeException("Payout already generated for " + month);
        }

        // Parse month and calculate date range
        YearMonth ym = YearMonth.parse(month, DateTimeFormatter.ofPattern("yyyy-MM"));
        LocalDateTime from = ym.atDay(1).atStartOfDay();
        LocalDateTime to = ym.atEndOfMonth().atTime(23, 59, 59);

        // Count completed sessions for this teacher in the month
        List<ClassSession> completed = sessionRepo
                .findByBatch_Teacher_IdAndStatusAndScheduledAtBetween(
                        teacherId, SessionStatus.COMPLETED, from, to);

        TeacherProfile profile = teacherRepo.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher profile not found"));

        PayoutRecord payout = new PayoutRecord();
        payout.setTeacher(teacher);
        payout.setMonth(month);
        payout.setClassesCompleted(completed.size());
        payout.setRatePerClass(profile.getPayPerClass());
        payout.setTotalAmount(completed.size() * profile.getPayPerClass());
        payout.setStatus(PayoutStatus.PENDING);
        payout.setCreatedAt(LocalDateTime.now());

        PayoutRecord saved = payoutRepo.save(payout);
        return payoutMapper.toPayoutResponse(saved);
    }

    @Transactional
    public PayoutResponse markPaid(Long payoutId) {
        PayoutRecord payout = payoutRepo.findById(payoutId)
                .orElseThrow(() -> new RuntimeException("Payout not found"));
        payout.setStatus(PayoutStatus.PAID);
        payout.setPaidAt(LocalDateTime.now());
        PayoutRecord saved = payoutRepo.save(payout);
        return payoutMapper.toPayoutResponse(saved);
    }

    public List<PayoutResponse> getAllPayouts(String month) {
        List<PayoutRecord> records = (month != null && !month.isBlank())
                ? payoutRepo.findByMonth(month)
                : payoutRepo.findAll();
        return records.stream().map(payoutMapper::toPayoutResponse).collect(Collectors.toList());
    }

    public List<PayoutResponse> getTeacherPayouts(Long teacherId) {
        return payoutRepo.findByTeacher_Id(teacherId).stream()
                .map(payoutMapper::toPayoutResponse).collect(Collectors.toList());
    }

    // ─── Dashboard Stats ───

    public DashboardStats getDashboardStats() {
        DashboardStats stats = new DashboardStats();
        stats.setTotalStudents(userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.STUDENT).count());
        stats.setTotalTeachers(userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.TEACHER && u.isApproved()).count());
        stats.setPendingApprovals(userRepo.findAll().stream()
                .filter(u -> u.getRole() == Role.TEACHER && !u.isApproved()).count());
        stats.setActiveBatches(batchRepo.findByIsActiveTrue().size());
        return stats;
    }

    @lombok.Data
    public static class DashboardStats {
        private long totalStudents;
        private long totalTeachers;
        private long pendingApprovals;
        private long activeBatches;
    }
}
