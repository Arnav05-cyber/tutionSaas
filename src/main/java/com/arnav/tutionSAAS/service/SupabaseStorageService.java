package com.arnav.tutionSAAS.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

/**
 * Supabase Storage implementation of StorageService.
 * Files are stored in a Supabase Storage bucket.
 * Activated when app.storage.provider=supabase
 */
@Service
@Primary
@ConditionalOnProperty(name = "app.storage.provider", havingValue = "supabase")
public class SupabaseStorageService implements StorageService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.secret.key}")
    private String supabaseSecretKey;

    @Value("${supabase.storage.bucket:resources}")
    private String bucketName;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Override
    public String upload(MultipartFile file, String key) throws IOException {
        String url = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + key;

        try {
            byte[] fileBytes = file.getBytes();
            String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + supabaseSecretKey)
                    .header("Content-Type", contentType)
                    .header("x-upsert", "true")
                    .POST(HttpRequest.BodyPublishers.ofByteArray(fileBytes))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200 && response.statusCode() != 201) {
                throw new IOException("Supabase upload failed (HTTP " + response.statusCode() + "): " + response.body());
            }

            return key;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Upload interrupted", e);
        }
    }

    @Override
    public String generateDownloadUrl(String key) {
        // Public bucket URL — no auth needed for downloads
        return supabaseUrl + "/storage/v1/object/public/" + bucketName + "/" + key;
    }

    @Override
    public void delete(String key) throws IOException {
        String url = supabaseUrl + "/storage/v1/object/" + bucketName + "/" + key;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Authorization", "Bearer " + supabaseSecretKey)
                    .DELETE()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200 && response.statusCode() != 204) {
                System.err.println("Supabase delete warning (HTTP " + response.statusCode() + "): " + response.body());
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IOException("Delete interrupted", e);
        }
    }
}
