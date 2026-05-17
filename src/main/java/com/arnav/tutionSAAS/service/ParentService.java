package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.LinkedStudentResponse;
import com.arnav.tutionSAAS.entity.*;
import com.arnav.tutionSAAS.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ParentService {

    @Autowired private UserRepo userRepo;
    @Autowired private ParentProfileRepo parentProfileRepo;
    @Autowired private StudentRepo studentRepo;
    @Autowired private AttendanceRepo attendanceRepo;
    @Autowired private BatchRepo batchRepo;

    @Autowired private com.arnav.tutionSAAS.util.BatchMapper batchMapper;
    @Autowired private ClassSessionRepo classSessionRepo;
    @Autowired private com.arnav.tutionSAAS.util.ClassSessionMapper sessionMapper;

    /**
     * Parent enters a student's 6-char link code to connect to them.
     */
    @Transactional
    public void linkToStudent(String parentClerkId, String linkCode) {
        User parentUser = userRepo.findByClerkId(parentClerkId)
                .orElseThrow(() -> new RuntimeException("Parent user not found"));

        if (parentUser.getRole() != Role.PARENT) {
            throw new RuntimeException("Only parent accounts can link to students");
        }

        StudentProfile studentProfile = studentRepo.findByParentLinkCode(linkCode)
                .orElseThrow(() -> new RuntimeException("Invalid link code — ask the student to generate a new one"));

        User student = studentProfile.getUser();

        ParentProfile parentProfile = parentProfileRepo.findByUser_ClerkId(parentClerkId)
                .orElseThrow(() -> new RuntimeException("Parent profile not found"));

        if (parentProfile.getLinkedStudents().contains(student)) {
            throw new RuntimeException("Already linked to this student");
        }

        parentProfile.getLinkedStudents().add(student);
        parentProfileRepo.save(parentProfile);
    }

    /**
     * Returns all students linked to this parent.
     */
    public List<LinkedStudentResponse> getLinkedStudents(String parentClerkId) {
        ParentProfile parentProfile = parentProfileRepo.findByUser_ClerkId(parentClerkId)
                .orElseThrow(() -> new RuntimeException("Parent profile not found"));

        return parentProfile.getLinkedStudents().stream()
                .map(student -> {
                    LinkedStudentResponse dto = new LinkedStudentResponse();
                    dto.setStudentId(student.getId());
                    dto.setStudentName(student.getFullName());
                    dto.setEmail(student.getEmail());
                    dto.setGrade(student.getGrade());
                    dto.setBlocked(student.isBlocked());

                    StudentProfile sp = studentRepo.findById(student.getId()).orElse(null);
                    dto.setFeesPaid(sp != null && sp.isFeesPaidForCurrentMonth());

                    return dto;
                })
                .collect(Collectors.toList());
    }

    /**
     * Returns attendance summary for a student linked to this parent.
     */
    public AttendanceService.AttendanceSummary getStudentAttendance(String parentClerkId, Long studentId, Long batchId) {
        assertParentLinkedToStudent(parentClerkId, studentId);

        long total = attendanceRepo.countByStudent_IdAndSession_Batch_Id(studentId, batchId);
        long attended = attendanceRepo.countByStudent_IdAndPresentTrueAndSession_Batch_Id(studentId, batchId);

        AttendanceService.AttendanceSummary summary = new AttendanceService.AttendanceSummary();
        summary.setTotalSessions(total);
        summary.setAttendedSessions(attended);
        summary.setPercentage(total > 0 ? (double) attended / total * 100.0 : 0.0);
        return summary;
    }

    /**
     * Returns fee status for a student linked to this parent.
     */
    public java.util.Map<String, Object> getStudentFeeStatus(String parentClerkId, Long studentId) {
        assertParentLinkedToStudent(parentClerkId, studentId);
        StudentProfile profile = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));
        
        List<Batch> batches = batchRepo.findByStudents_Id(studentId);
        double totalFee = batches.stream().mapToDouble(Batch::getMonthlyFee).sum();
        
        return java.util.Map.of(
            "studentId", studentId,
            "totalMonthlyFee", totalFee,
            "feesPaidForCurrentMonth", profile.isFeesPaidForCurrentMonth()
        );
    }
    
    @Transactional
    public void payStudentFees(String parentClerkId, Long studentId) {
        assertParentLinkedToStudent(parentClerkId, studentId);
        StudentProfile profile = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student profile not found"));
        profile.setFeesPaidForCurrentMonth(true);
        studentRepo.save(profile);
    }
    
    public List<com.arnav.tutionSAAS.dto.BatchResponse> getStudentBatches(String parentClerkId, Long studentId) {
        assertParentLinkedToStudent(parentClerkId, studentId);
        return batchRepo.findByStudents_Id(studentId).stream()
                .map(batchMapper::toBatchResponse)
                .collect(Collectors.toList());
    }
    
    public List<com.arnav.tutionSAAS.dto.ClassSessionResponse> getStudentSessions(String parentClerkId, Long studentId) {
        assertParentLinkedToStudent(parentClerkId, studentId);
        List<Batch> batches = batchRepo.findByStudents_Id(studentId);
        List<Long> batchIds = batches.stream().map(Batch::getId).collect(Collectors.toList());
        if (batchIds.isEmpty()) return List.of();
        
        return classSessionRepo.findByBatch_IdInAndStatusAndScheduledAtAfterOrderByScheduledAtAsc(
                batchIds, SessionStatus.SCHEDULED, java.time.LocalDateTime.now().minusHours(2))
                .stream()
                .map(sessionMapper::toSessionResponse)
                .collect(Collectors.toList());
    }

    // ─── Guard: ensures the parent is actually linked to the student ───
    private void assertParentLinkedToStudent(String parentClerkId, Long studentId) {
        ParentProfile parentProfile = parentProfileRepo.findByUser_ClerkId(parentClerkId)
                .orElseThrow(() -> new RuntimeException("Parent profile not found"));

        boolean linked = parentProfile.getLinkedStudents().stream()
                .anyMatch(s -> s.getId().equals(studentId));

        if (!linked) {
            throw new RuntimeException("You are not linked to this student");
        }
    }
}
