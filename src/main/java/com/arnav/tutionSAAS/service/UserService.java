package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.OnboardingRequest;
import com.arnav.tutionSAAS.entity.*;
import com.arnav.tutionSAAS.repository.*;
import com.arnav.tutionSAAS.util.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Random;

@Service
public class UserService {

    @Autowired private UserRepo userRepository;
    @Autowired private TeacherRepo teacherRepository;
    @Autowired private StudentRepo studentRepository;
    @Autowired private ParentProfileRepo parentProfileRepo;
    @Autowired private TeacherInviteRepo teacherInviteRepo;
    @Autowired private UserMapper userMapper;

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