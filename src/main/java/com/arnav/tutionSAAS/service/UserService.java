package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.OnboardingRequest;
import com.arnav.tutionSAAS.entity.*;
import com.arnav.tutionSAAS.repository.*;
import com.arnav.tutionSAAS.util.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Random;

@Service
public class UserService {

    @Autowired private UserRepo userRepository;
    @Autowired private TeacherRepo teacherRepository;
    @Autowired private StudentRepo studentRepository;
    @Autowired private ParentProfileRepo parentProfileRepo;
    @Autowired private TeacherInviteRepo teacherInviteRepo;
    @Autowired private UserMapper userMapper;
    @Autowired private AttendanceRepo attendanceRepo;
    @Autowired private SessionJoinLogRepo sessionJoinLogRepo;
    @Autowired private BatchJoinRequestRepo batchJoinRequestRepo;
    @Autowired private PaymentHistoryRepo paymentHistoryRepo;
    @Autowired private ResourceRepo resourceRepo;
    @Autowired private BatchRepo batchRepo;
    @Autowired private StorageService storageService;

    @Transactional
    public User onboardUser(String clerkId, String email, OnboardingRequest request) {
        Role role = Role.valueOf(request.getRole().toUpperCase());

        // Teachers must have a valid, unused, non-expired invite token
        if (role == Role.TEACHER) {
            String token = request.getInviteToken();
            if (token == null || token.isBlank()) {
                throw new RuntimeException("Teacher signup requires a valid invite token");
            }
            TeacherInvite invite = teacherInviteRepo.findByTokenAndUsedFalse(token)
                    .orElseThrow(() -> new RuntimeException("Invalid or expired invite token"));

            if (invite.getExpiresAt() != null && java.time.LocalDateTime.now().isAfter(invite.getExpiresAt())) {
                throw new RuntimeException("Invite token has expired");
            }

            // Mark invite as used
            invite.setUsed(true);
            teacherInviteRepo.save(invite);
        }

        User user = userMapper.toUserEntity(clerkId, email, request);
        User savedUser = userRepository.save(user);

        // Create the appropriate profile
        if (savedUser.getRole() == Role.TEACHER) {
            teacherRepository.save(userMapper.toTeacherProfile(savedUser, request));
        } else if (savedUser.getRole() == Role.STUDENT) {
            studentRepository.save(userMapper.toStudentProfile(savedUser));
        } else if (savedUser.getRole() == Role.PARENT) {
            parentProfileRepo.save(userMapper.toParentProfile(savedUser));
        }

        return savedUser;
    }

    /**
     * Deletes a user and ALL associated data from the database.
     * Called when Clerk fires a user.deleted webhook event.
     *
     * Deletion order matters due to foreign key constraints:
     * 1. Attendance records (references user + session)
     * 2. Session join logs (references user + session)
     * 3. Batch join requests (references user + batch)
     * 4. Payment history (references user)
     * 5. Resources uploaded by this user (references user + batch)
     * 6. Remove user from batch_students join table
     * 7. Role-specific profile (teacher/student/parent)
     * 8. The user record itself
     */
    @Transactional
    public void deleteUserByClerkId(String clerkId) {
        User user = userRepository.findByClerkId(clerkId).orElse(null);
        if (user == null) {
            System.out.println("User not found for clerkId: " + clerkId + " — skipping deletion");
            return;
        }

        Long userId = user.getId();
        System.out.println("Deleting user " + userId + " (" + user.getEmail() + "), role: " + user.getRole());

        // 1. Delete attendance records where this user is the student
        attendanceRepo.deleteByStudent_Id(userId);

        // 2. Delete session join logs where this user is the student
        sessionJoinLogRepo.deleteByStudent_Id(userId);

        // 3. Delete batch join requests where this user is the student
        batchJoinRequestRepo.deleteByStudent_Id(userId);

        // 4. Delete payment history
        paymentHistoryRepo.deleteByStudent_Id(userId);

        // 5. Delete resources uploaded by this user (also clean up storage files)
        List<Resource> resources = resourceRepo.findByUploadedBy_Id(userId);
        for (Resource r : resources) {
            try {
                storageService.delete(r.getStorageKey());
            } catch (Exception e) {
                System.err.println("Failed to delete storage file: " + r.getStorageKey() + " — " + e.getMessage());
            }
        }
        resourceRepo.deleteAll(resources);

        // 6. Remove user from all batch_students join tables
        List<Batch> batches = batchRepo.findByStudents_Id(userId);
        for (Batch batch : batches) {
            batch.getStudents().removeIf(s -> s.getId().equals(userId));
            batchRepo.save(batch);
        }

        // 7. Delete role-specific profile
        switch (user.getRole()) {
            case TEACHER:
                teacherRepository.findById(userId).ifPresent(teacherRepository::delete);
                break;
            case STUDENT:
                studentRepository.findById(userId).ifPresent(studentRepository::delete);
                break;
            case PARENT:
                parentProfileRepo.findById(userId).ifPresent(parentProfileRepo::delete);
                break;
            default:
                break;
        }

        // 8. Delete the user record
        userRepository.delete(user);
        System.out.println("User " + userId + " deleted successfully");
    }

    /**
     * Student generates a unique 6-char alphanumeric code to share with their parent.
     * Idempotent — if a code already exists, returns it unchanged.
     */
    @Transactional
    public String generateParentLinkCode(String clerkId) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getRole() != Role.STUDENT) {
            throw new RuntimeException("Only students can generate a parent link code");
        }

        StudentProfile profile = studentRepository.findById(user.getId())
                .orElseThrow(() -> new RuntimeException("Student profile not found"));

        // Return existing code if already generated
        if (profile.getParentLinkCode() != null && !profile.getParentLinkCode().isBlank()) {
            return profile.getParentLinkCode();
        }

        // Generate a unique 6-char code
        String code = generateUniqueCode();
        profile.setParentLinkCode(code);
        studentRepository.save(profile);
        return code;
    }

    private String generateUniqueCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        String code;
        // Retry until we get a unique one
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(chars.charAt(random.nextInt(chars.length())));
            }
            code = sb.toString();
        } while (studentRepository.findByParentLinkCode(code).isPresent());
        return code;
    }
}