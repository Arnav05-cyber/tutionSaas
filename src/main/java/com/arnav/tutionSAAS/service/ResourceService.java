package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.dto.ResourceResponse;
import com.arnav.tutionSAAS.dto.ResourceUploadRequest;
import com.arnav.tutionSAAS.entity.*;
import com.arnav.tutionSAAS.repository.BatchRepo;
import com.arnav.tutionSAAS.repository.ResourceRepo;
import com.arnav.tutionSAAS.repository.UserRepo;
import com.arnav.tutionSAAS.util.ResourceMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ResourceService {

    @Autowired private ResourceRepo resourceRepo;
    @Autowired private BatchRepo batchRepo;
    @Autowired private UserRepo userRepo;
    @Autowired private StorageService storageService;
    @Autowired private ResourceMapper resourceMapper;

    @Transactional
    public ResourceResponse uploadResource(Long batchId, MultipartFile file,
                                           ResourceUploadRequest request, String clerkId) {
        Batch batch = batchRepo.findById(batchId)
                .orElseThrow(() -> new RuntimeException("Batch not found"));
        User teacher = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        if (!batch.getTeacher().getId().equals(teacher.getId())) {
            throw new RuntimeException("You can only upload resources to your own batches");
        }

        String storageKey = "batch-" + batchId + "/" + UUID.randomUUID() + "_" + file.getOriginalFilename();
        try {
            storageService.upload(file, storageKey);
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file: " + e.getMessage(), e);
        }

        Resource resource = new Resource();
        resource.setBatch(batch);
        resource.setUploadedBy(teacher);
        resource.setTitle(request.getTitle());
        resource.setDescription(request.getDescription());
        resource.setType(ResourceType.valueOf(request.getType().toUpperCase()));
        resource.setFileName(file.getOriginalFilename());
        resource.setStorageKey(storageKey);
        resource.setFileSizeBytes(file.getSize());
        resource.setUploadedAt(LocalDateTime.now());

        Resource saved = resourceRepo.save(resource);
        return resourceMapper.toResourceResponse(saved, storageService.generateDownloadUrl(saved.getStorageKey()));
    }

    public List<ResourceResponse> getResourcesForBatch(Long batchId) {
        return resourceRepo.findByBatch_IdOrderByUploadedAtDesc(batchId).stream()
                .map(r -> resourceMapper.toResourceResponse(r, storageService.generateDownloadUrl(r.getStorageKey())))
                .collect(Collectors.toList());
    }

    public List<ResourceResponse> getResourcesForBatchByType(Long batchId, String type) {
        ResourceType rt = ResourceType.valueOf(type.toUpperCase());
        return resourceRepo.findByBatch_IdAndType(batchId, rt).stream()
                .map(r -> resourceMapper.toResourceResponse(r, storageService.generateDownloadUrl(r.getStorageKey())))
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteResource(Long resourceId, String clerkId) {
        Resource resource = resourceRepo.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));
        User teacher = userRepo.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        if (!resource.getUploadedBy().getId().equals(teacher.getId())) {
            throw new RuntimeException("You can only delete your own resources");
        }
        try { storageService.delete(resource.getStorageKey()); } catch (IOException e) { /* log */ }
        resourceRepo.delete(resource);
    }
}
