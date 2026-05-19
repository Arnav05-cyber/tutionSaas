package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

/**
 * Handles Clerk webhook events (e.g. user.deleted).
 * The endpoint is public (no JWT required) but protected by
 * HMAC-SHA256 signature verification using the Clerk webhook secret.
 */
@RestController
@RequestMapping("/api/public/webhooks")
public class WebhookController {

    @Autowired
    private UserService userService;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${clerk.webhook.secret:}")
    private String webhookSecret;

    @PostMapping("/clerk")
    public ResponseEntity<String> handleClerkWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "svix-id", required = false) String svixId,
            @RequestHeader(value = "svix-timestamp", required = false) String svixTimestamp,
            @RequestHeader(value = "svix-signature", required = false) String svixSignature) {

        // If a webhook secret is configured, verify the signature
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            if (svixId == null || svixTimestamp == null || svixSignature == null) {
                System.err.println("Webhook rejected: missing Svix headers");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Missing signature headers");
            }

            if (!verifySignature(payload, svixId, svixTimestamp, svixSignature)) {
                System.err.println("Webhook rejected: invalid signature");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid signature");
            }
        }

        try {
            JsonNode root = objectMapper.readTree(payload);
            String eventType = root.path("type").asText();
            System.out.println("Clerk webhook received: " + eventType);

            if ("user.deleted".equals(eventType)) {
                String clerkId = root.path("data").path("id").asText();
                if (clerkId != null && !clerkId.isBlank()) {
                    System.out.println("Processing user deletion for clerkId: " + clerkId);
                    userService.deleteUserByClerkId(clerkId);
                    System.out.println("User deleted successfully: " + clerkId);
                }
            }

            return ResponseEntity.ok("OK");
        } catch (Exception e) {
            System.err.println("Error processing webhook: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error processing webhook");
        }
    }

    /**
     * Verifies the Svix webhook signature.
     * Clerk uses Svix under the hood; the signing secret starts with "whsec_".
     */
    private boolean verifySignature(String payload, String svixId, String svixTimestamp, String svixSignature) {
        try {
            // The webhook secret from Clerk starts with "whsec_", strip it for the raw key
            String secret = webhookSecret.startsWith("whsec_")
                    ? webhookSecret.substring(6)
                    : webhookSecret;

            // Decode the base64-encoded secret
            byte[] secretBytes = java.util.Base64.getDecoder().decode(secret);

            // Build the signed content: "{svix_id}.{svix_timestamp}.{body}"
            String signedContent = svixId + "." + svixTimestamp + "." + payload;

            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secretBytes, "HmacSHA256"));
            byte[] hash = mac.doFinal(signedContent.getBytes(StandardCharsets.UTF_8));
            String computedSignature = "v1," + java.util.Base64.getEncoder().encodeToString(hash);

            // Svix may send multiple signatures separated by spaces
            String[] signatures = svixSignature.split(" ");
            for (String sig : signatures) {
                if (sig.equals(computedSignature)) {
                    return true;
                }
            }

            return false;
        } catch (Exception e) {
            System.err.println("Signature verification error: " + e.getMessage());
            return false;
        }
    }
}
