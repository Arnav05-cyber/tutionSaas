package com.arnav.tutionSAAS.service;

import com.arnav.tutionSAAS.entity.ClassSession;
import com.arnav.tutionSAAS.entity.SessionStatus;
import com.arnav.tutionSAAS.entity.User;
import com.arnav.tutionSAAS.repository.ClassSessionRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class EmailReminderService {

    @Autowired
    private ClassSessionRepo sessionRepo;

    @Autowired(required = false)
    private JavaMailSender mailSender;

    /**
     * Runs every minute. Finds sessions starting in the next 15 minutes
     * that haven't had reminders sent, and emails all batch students.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void sendUpcomingClassReminders() {
        if (mailSender == null) return; // Skip if mail not configured

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime fifteenMinLater = now.plusMinutes(15);

        List<ClassSession> sessions = sessionRepo
                .findByScheduledAtBetweenAndReminderSentFalseAndStatus(now, fifteenMinLater, SessionStatus.SCHEDULED);

        for (ClassSession session : sessions) {
            for (User student : session.getBatch().getStudents()) {
                if (student.getEmail() != null) {
                    SimpleMailMessage msg = new SimpleMailMessage();
                    msg.setTo(student.getEmail());
                    msg.setSubject("Upcoming Class: " + session.getTitle());
                    msg.setText(String.format(
                        "Hi %s,\n\nYour class \"%s\" for %s starts in 15 minutes.\n\nJoin here: %s\n\nBatch: %s\nTeacher: %s",
                        student.getFullName(),
                        session.getTitle(),
                        session.getBatch().getName(),
                        session.getGoogleMeetLink(),
                        session.getBatch().getName(),
                        session.getBatch().getTeacher().getFullName()
                    ));
                    try {
                        mailSender.send(msg);
                    } catch (Exception e) {
                        // Log error but continue with other students
                    }
                }
            }
            session.setReminderSent(true);
            sessionRepo.save(session);
        }
    }
}
