package com.arnav.tutionSAAS.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;

/**
 * Local filesystem implementation of StorageService.
 * Files are stored under the configured upload directory.
 * Replace with S3StorageService for production.
 */
@Service
public class LocalStorageService implements StorageService {

    @Value("${app.storage.local.path:./uploads}")
    private String uploadDir;

    @Override
    public String upload(MultipartFile file, String key) throws IOException {
        Path targetDir = Paths.get(uploadDir);
        Files.createDirectories(targetDir);

        Path targetPath = targetDir.resolve(key);
        // Ensure parent directories exist for nested keys
        Files.createDirectories(targetPath.getParent());
        Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

        return key;
    }

    @Override
    public String generateDownloadUrl(String key) {
        // For local storage, return an API path that a download controller can serve
        return "/api/resources/download/" + key;
    }

    @Override
    public void delete(String key) throws IOException {
        Path filePath = Paths.get(uploadDir).resolve(key);
        Files.deleteIfExists(filePath);
    }
}
