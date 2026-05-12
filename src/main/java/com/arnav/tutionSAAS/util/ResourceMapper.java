package com.arnav.tutionSAAS.util;

import com.arnav.tutionSAAS.dto.ResourceResponse;
import com.arnav.tutionSAAS.entity.Resource;
import org.springframework.stereotype.Component;

@Component
public class ResourceMapper {

    public ResourceResponse toResourceResponse(Resource resource, String downloadUrl) {
        ResourceResponse response = new ResourceResponse();
        response.setId(resource.getId());
        response.setTitle(resource.getTitle());
        response.setDescription(resource.getDescription());
        response.setType(resource.getType().name());
        response.setFileName(resource.getFileName());
        response.setFileSizeBytes(resource.getFileSizeBytes());
        response.setDownloadUrl(downloadUrl);
        response.setUploadedAt(resource.getUploadedAt());
        response.setBatchName(resource.getBatch().getName());
        response.setTeacherName(resource.getUploadedBy().getFullName());
        return response;
    }
}
