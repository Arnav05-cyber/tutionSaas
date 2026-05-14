package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.entity.TeacherInvite;
import com.arnav.tutionSAAS.repository.TeacherInviteRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/**
 * Public endpoints that do NOT require authentication.
 * Used by the frontend before a user has logged in.
 */
@RestController
@RequestMapping("/api/public")
public class PublicController {

    @Autowired private TeacherInviteRepo inviteRepo;

    /**
     * Frontend calls this to check if a teacher invite token is valid
     * before showing the teacher signup form.
     */
    @GetMapping("/invites/validate")
    public ResponseEntity<Map<String, Object>> validateInvite(@RequestParam String token) {
        Optional<TeacherInvite> inviteOpt = inviteRepo.findByTokenAndUsedFalse(token);

        if (inviteOpt.isEmpty()) {
            return ResponseEntity.ok(Map.of("valid", false, "reason", "Token not found or already used"));
        }

        TeacherInvite invite = inviteOpt.get();
        if (invite.getExpiresAt() != null && LocalDateTime.now().isAfter(invite.getExpiresAt())) {
            return ResponseEntity.ok(Map.of("valid", false, "reason", "Token has expired"));
        }

        return ResponseEntity.ok(Map.of(
                "valid", true,
                "email", invite.getEmail() != null ? invite.getEmail() : ""
        ));
    }
}
