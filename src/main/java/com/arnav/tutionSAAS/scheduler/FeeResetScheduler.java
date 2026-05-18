package com.arnav.tutionSAAS.scheduler;

import com.arnav.tutionSAAS.repository.StudentRepo;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class FeeResetScheduler {

    @Autowired
    private StudentRepo studentRepo;

    // Runs at midnight (00:00:00) on the 1st day of every month in the server's time zone
    @Scheduled(cron = "0 0 0 1 * ?")
    @Transactional
    public void resetMonthlyFees() {
        System.out.println("Running automated monthly fee reset scheduler...");
        studentRepo.resetAllFees();
        System.out.println("Successfully reset all student fee statuses to Unpaid for the new month.");
    }
}
