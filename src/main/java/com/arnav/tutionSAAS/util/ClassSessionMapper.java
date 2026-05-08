package com.arnav.tutionSAAS.util;

import com.arnav.tutionSAAS.dto.ClassSessionRequest;
import com.arnav.tutionSAAS.dto.ClassSessionResponse;
import com.arnav.tutionSAAS.entity.Batch;
import com.arnav.tutionSAAS.entity.ClassSession;
import com.arnav.tutionSAAS.entity.SessionStatus;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
public class ClassSessionMapper {

    public ClassSession toSessionEntity(ClassSessionRequest dto, Batch batch) {
        ClassSession session = new ClassSession();
        session.setBatch(batch);
        session.setTitle(dto.getTitle());
        session.setScheduledAt(dto.getScheduledAt());
        session.setDurationMinutes(dto.getDurationMinutes() > 0 ? dto.getDurationMinutes() : 60);
        session.setGoogleMeetLink(dto.getGoogleMeetLink());
        session.setStatus(SessionStatus.SCHEDULED);
        session.setReminderSent(false);
        session.setCreatedAt(LocalDateTime.now());
        return session;
    }

    public ClassSessionResponse toSessionResponse(ClassSession session) {
        ClassSessionResponse response = new ClassSessionResponse();
        response.setId(session.getId());
        response.setTitle(session.getTitle());
        response.setScheduledAt(session.getScheduledAt());
        response.setDurationMinutes(session.getDurationMinutes());
        response.setGoogleMeetLink(session.getGoogleMeetLink());
        response.setStatus(session.getStatus().name());
        response.setBatchName(session.getBatch().getName());
        response.setBatchId(session.getBatch().getId());
        return response;
    }

    public void updateSessionFromDto(ClassSession session, ClassSessionRequest dto) {
        if (dto.getTitle() != null) session.setTitle(dto.getTitle());
        if (dto.getScheduledAt() != null) session.setScheduledAt(dto.getScheduledAt());
        if (dto.getDurationMinutes() > 0) session.setDurationMinutes(dto.getDurationMinutes());
        if (dto.getGoogleMeetLink() != null) session.setGoogleMeetLink(dto.getGoogleMeetLink());
    }
}
