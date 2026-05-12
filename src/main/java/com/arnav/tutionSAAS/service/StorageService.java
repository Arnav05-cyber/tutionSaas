package com.arnav.tutionSAAS.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

/**
 * Abstraction for file storage. Currently backed by local filesystem.
 * Swap implementation to S3StorageService when ready for production.
 */
public interface StorageService {

    /**
     * Upload a file and return the storage key.
     */
    String upload(MultipartFile file, String key) throws IOException;

    /**
     * Generate a URL/path to download the file.
     * For local: returns a relative API path.
     * For S3: would return a pre-signed URL.
     */
    String generateDownloadUrl(String key);

    /**
     * Delete a file by its storage key.
     */
    void delete(String key) throws IOException;
}
