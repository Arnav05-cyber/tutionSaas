package com.arnav.tutionSAAS.controller;

import com.arnav.tutionSAAS.dto.ResourceResponse;
import com.arnav.tutionSAAS.dto.ResourceUploadRequest;
import com.arnav.tutionSAAS.service.ResourceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
public class ResourceController {

    @Autowired private ResourceService resourceService;

    @PostMapping("/api/batches/{batchId}/resources")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<ResourceResponse> upload(
            @PathVariable Long batchId,
            @RequestParam("file") MultipartFile file,
            @ModelAttribute ResourceUploadRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(resourceService.uploadResource(batchId, file, request, jwt.getSubject()));
    }

    @GetMapping("/api/batches/{batchId}/resources")
    public ResponseEntity<List<ResourceResponse>> getResources(
            @PathVariable Long batchId,
            @RequestParam(required = false) String type) {
        if (type != null && !type.isBlank()) {
            return ResponseEntity.ok(resourceService.getResourcesForBatchByType(batchId, type));
        }
        return ResponseEntity.ok(resourceService.getResourcesForBatch(batchId));
    }

    @DeleteMapping("/api/resources/{id}")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<Void> deleteResource(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {
        resourceService.deleteResource(id, jwt.getSubject());
        return ResponseEntity.noContent().build();
    }
}
