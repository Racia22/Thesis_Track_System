-- When the thesis entered its current status. Maintained by ThesisService on every
-- status change; existing rows are back-filled at startup by StageHistoryBackfill.
ALTER TABLE theses ADD COLUMN stage_entered_at TIMESTAMP;

-- One row per stage a thesis has been in. exited_at is NULL for the current stage.
CREATE TABLE thesis_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thesis_id UUID NOT NULL REFERENCES theses(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL
        CHECK (status IN (
            'REGISTERED',
            'PROTOTYPE_PENDING',
            'PROTOTYPE_REVIEWED',
            'SUPERVISOR_ASSIGNED',
            'IN_PROGRESS',
            'READY_FOR_DEFENSE',
            'COMPLETED'
        )),
    entered_at TIMESTAMP NOT NULL,
    exited_at TIMESTAMP,
    changed_by UUID REFERENCES users(id),
    -- 'RECORDED' = captured live when the transition happened;
    -- 'INFERRED' = reconstructed from timestamps for theses that predate this table.
    source VARCHAR(10) NOT NULL DEFAULT 'RECORDED' CHECK (source IN ('RECORDED', 'INFERRED'))
);

CREATE INDEX idx_stage_history_thesis_id ON thesis_stage_history(thesis_id);
CREATE INDEX idx_stage_history_status ON thesis_stage_history(status);
-- At most one open (current) stage per thesis.
CREATE UNIQUE INDEX uq_stage_history_open ON thesis_stage_history(thesis_id) WHERE exited_at IS NULL;
