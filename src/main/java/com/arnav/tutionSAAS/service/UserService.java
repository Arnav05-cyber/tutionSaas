package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.OnboardingRequest;
import com.arnav.tutionSAAS.entity.*;
import com.arnav.tutionSAAS.repository.*;
import com.arnav.tutionSAAS.util.UserMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    @Autowired
    private UserRepo userRepository;

    @Autowired
    private TeacherRepo teacherRepository;

    @Autowired
    private StudentRepo studentRepository;

    @Autowired
    private UserMapper userMapper;

    @Transactional
    public User onboardUser(String clerkId, String email, OnboardingRequest request) {
        // Map DTO to User Entity
        User user = userMapper.toUserEntity(clerkId, email, request);
        User savedUser = userRepository.save(user);

        // Map and Save Profiles based on Role
        if (savedUser.getRole() == Role.TEACHER) {
            teacherRepository.save(userMapper.toTeacherProfile(savedUser, request));
        } else if (savedUser.getRole() == Role.STUDENT) {
            studentRepository.save(userMapper.toStudentProfile(savedUser));
        }

        return savedUser;
    }
}