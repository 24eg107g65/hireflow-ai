package com.hireflow.backend.note;

import com.hireflow.backend.application.InternshipApplication;
import com.hireflow.backend.common.AuditableEntity;
import com.hireflow.backend.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "application_notes")
public class Note extends AuditableEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private InternshipApplication application;
    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    protected Note() {
    }

    public Note(User user, InternshipApplication application, String content) {
        this.user = user;
        this.application = application;
        this.content = content;
    }

    public Long getId() {
        return id;
    }

    public Long getApplicationId() {
        return application.getId();
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }
}