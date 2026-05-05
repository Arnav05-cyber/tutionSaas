package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.OnboardingRequest;
import com.arnav.tutionSAAS.dto.UserResponse;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.UserRepo;
import com.arnav.tutionSAAS.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired private UserService userService;
    @Autowired private UserRepo userRepo;

    @PostMapping("/onboard")
    public ResponseEntity<UserResponse> onboard(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody OnboardingRequest request) {
        String clerkId = jwt.getSubject();
        String email = jwt.getClaimAsString("email");
        User user = userService.onboardUser(clerkId, email, request);
        return ResponseEntity.ok(toResponse(user));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(@AuthenticationPrincipal Jwt jwt) {
        String clerkId = jwt.getSubject();
        User user = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(toResponse(user));
    }

    private UserResponse toResponse(User user) {
        UserResponse r = new UserResponse();
        r.setId(user.getId());
        r.setClerkId(user.getClerkId());
        r.setFullName(user.getFullName());
        r.setEmail(user.getEmail());
        r.setPhoneNumber(user.getPhoneNumber());
        r.setRole(user.getRole().name());
        r.setGrade(user.getGrade());
        r.setApproved(user.isApproved());
        r.setOnboardingComplete(user.isOnboardingComplete());
        return r;
    }
}
