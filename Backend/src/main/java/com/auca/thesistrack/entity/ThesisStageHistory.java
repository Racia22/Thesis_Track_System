package com.auca.thesistrack.entity;

import com.auca.thesistrack.entity.enums.ThesisStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "thesis_stage_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ThesisStageHistory {

    public static final String SOURCE_RECORDED = "RECORDED";
    public static final String SOURCE_INFERRED = "INFERRED";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "thesis_id", nullable = false)
    private Thesis thesis;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ThesisStatus status;

    @Column(name = "entered_at", nullable = false)
    private LocalDateTime enteredAt;

    @Column(name = "exited_at")
    private LocalDateTime exitedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "changed_by")
    private User changedBy;

    @Builder.Default
    @Column(nullable = false, length = 10)
    private String source = SOURCE_RECORDED;
}
