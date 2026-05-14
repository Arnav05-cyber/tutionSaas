package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.OnboardingRequest;
import com.arnav.tutionSAAS.dto.UserResponse;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.UserRepo;
import com.arnav.tutionSAAS.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

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
        User user = userRepo.findByClerkId(jwt.getSubject())
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(toResponse(user));
    }

    /**
     * Student generates a 6-char code to share with their parent.
     * Returns the code. Idempotent — repeated calls return the same code.
     */
    @PostMapping("/generate-link-code")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Map<String, String>> generateLinkCode(@AuthenticationPrincipal Jwt jwt) {
        String code = userService.generateParentLinkCode(jwt.getSubject());
        return ResponseEntity.ok(Map.of("linkCode", code));
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
        r.setBlocked(user.isBlocked());
        r.setOnboardingComplete(user.isOnboardingComplete());
        return r;
    }
}
