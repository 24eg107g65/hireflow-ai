package com.hireflow.backend.application;

import com.hireflow.backend.common.AuditableEntity;
import com.hireflow.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "internship_applications")
public class InternshipApplication extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(name = "company_name", nullable = false, length = 150)
    private String companyName;
    @Column(name = "job_role", nullable = false, length = 150)
    private String jobRole;
    @Column(name = "application_link", length = 2048)
    private String applicationLink;
    private LocalDate deadline;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 24)
    private ApplicationStatus status;
    @Column(name = "job_description", columnDefinition = "LONGTEXT")
    private String jobDescription;
    @Column(columnDefinition = "LONGTEXT")
    private String notes;

    protected InternshipApplication() {
    }

    public InternshipApplication(User user, String companyName, String jobRole, ApplicationStatus status) {
        this.user = user;
        this.companyName = companyName;
        this.jobRole = jobRole;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String value) {
        companyName = value;
    }

    public String getJobRole() {
        return jobRole;
    }

    public void setJobRole(String value) {
        jobRole = value;
    }

    public String getApplicationLink() {
        return applicationLink;
    }

    public void setApplicationLink(String value) {
        applicationLink = value;
    }

    public LocalDate getDeadline() {
        return deadline;
    }

    public void setDeadline(LocalDate value) {
        deadline = value;
    }

    public ApplicationStatus getStatus() {
        return status;
    }

    public void setStatus(ApplicationStatus value) {
        status = value;
    }

    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String value) {
        jobDescription = value;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String value) {
        notes = value;
    }
}