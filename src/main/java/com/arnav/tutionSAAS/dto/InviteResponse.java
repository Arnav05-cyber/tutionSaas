package com.arnav.tutionSAAS.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class InviteResponse {
    private Long id;
    private String token;
    private String inviteUrl;
    private String email;
    private boolean used;
    private LocalDateTime expiresAt;
    private LocalDateTime createdAt;
}
