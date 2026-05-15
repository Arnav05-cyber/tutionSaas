package com.arnav.tutionSAAS.config;

import com.arnav.tutionSAAS.entity.Role;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.UserRepo;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class AdminInitializer implements CommandLineRunner {

    @Value("${clerk.secret-key:}")
    private String clerkSecretKey;

    @Autowired
    private UserRepo userRepo;

    @Override
    public void run(String... args) throws Exception {
        if (clerkSecretKey == null || clerkSecretKey.isBlank()) {
            System.out.println("No clerk.secret-key provided, skipping Admin Init.");
            return;
        }

        String targetEmail = "arnav.vyas06@gmail.com";
        String targetPassword = "@Arnav0509";

        RestTemplate restTemplate = new RestTemplate();
        ObjectMapper mapper = new ObjectMapper();

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + clerkSecretKey);
        headers.set("Content-Type", "application/json");

        String clerkId = null;

        try {
            // 1. Check if user already exists
            String searchUrl = "https://api.clerk.com/v1/users?email_address=" + targetEmail;
            HttpEntity<Void> searchEntity = new HttpEntity<>(headers);
            ResponseEntity<String> searchResponse = restTemplate.exchange(searchUrl, HttpMethod.GET, searchEntity, String.class);

            JsonNode rootArray = mapper.readTree(searchResponse.getBody());
            if (rootArray.isArray() && rootArray.size() > 0) {
                clerkId = rootArray.get(0).get("id").asText();
                System.out.println("Admin user already exists in Clerk with ID: " + clerkId);
            } else {
                // 2. Create the user
                String createUrl = "https://api.clerk.com/v1/users";
                Map<String, Object> body = new HashMap<>();
                body.put("email_address", List.of(targetEmail));
                body.put("password", targetPassword);
                body.put("first_name", "Arnav");
                body.put("last_name", "Admin");
                body.put("skip_password_checks", true);

                HttpEntity<Map<String, Object>> createEntity = new HttpEntity<>(body, headers);
                ResponseEntity<String> createResponse = restTemplate.exchange(createUrl, HttpMethod.POST, createEntity, String.class);
                JsonNode createdNode = mapper.readTree(createResponse.getBody());
                clerkId = createdNode.get("id").asText();
                System.out.println("Created admin user in Clerk with ID: " + clerkId);
            }
        } catch (HttpClientErrorException e) {
            System.err.println("Error communicating with Clerk API: " + e.getResponseBodyAsString());
            return;
        } catch (Exception e) {
            System.err.println("Unexpected error communicating with Clerk API: " + e.getMessage());
            e.printStackTrace();
            return;
        }

        // 3. Ensure the user exists in our database with ROLE_ADMIN
        if (clerkId != null) {
            User existing = userRepo.findByClerkId(clerkId).orElse(null);
            if (existing == null) {
                User admin = new User();
                admin.setClerkId(clerkId);
                admin.setEmail(targetEmail);
                admin.setFullName("Arnav Admin");
                admin.setRole(Role.ADMIN);
                admin.setOnboardingComplete(true);
                userRepo.save(admin);
                System.out.println("Saved Admin user to local database.");
            } else {
                if (existing.getRole() != Role.ADMIN) {
                    existing.setRole(Role.ADMIN);
                    userRepo.save(existing);
                    System.out.println("Updated existing user to ADMIN role.");
                }
            }
        }
    }
}
