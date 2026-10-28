package com.auca.thesistrack.seed;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Reconstructs stage history for theses that have none — rows created before V2 added
 * {@code thesis_stage_history}, and rows the {@link DataSeeder} inserts directly through
 * the repository. Live transitions are recorded by ThesisService, so in steady state this
 * is a no-op.
 *
 * <p>Earlier stages are inferred from the timestamps the schema already kept
 * (registered_at, the first non-cancelled booking, prototype_reviewed_at,
 * supervisor_assigned_at). Stages with no timestamp of their own (IN_PROGRESS,
 * READY_FOR_DEFENSE, COMPLETED) can only be dated when they are the current stage, so for
 * legacy data some intermediate stages are simply absent rather than guessed. Inferred
 * rows are tagged {@code source = 'INFERRED'}.
 *
 * <p>Runs just before DataSeeder at startup; DataSeeder also calls {@link #backfill()}
 * once it finishes so freshly seeded data gets history in the same run.
 */
@Component
@Order(Integer.MAX_VALUE - 1)
public class StageHistoryBackfill implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(StageHistoryBackfill.class);

    private static final String STAGE_ORDER =
            "ARRAY['REGISTERED','PROTOTYPE_PENDING','PROTOTYPE_REVIEWED','SUPERVISOR_ASSIGNED'," +
                    "'IN_PROGRESS','READY_FOR_DEFENSE','COMPLETED']::varchar[]";

    private static final String FILL_STAGE_ENTERED_AT = """
            UPDATE theses t SET stage_entered_at = CASE t.status
                WHEN 'REGISTERED' THEN t.registered_at
                WHEN 'PROTOTYPE_PENDING' THEN COALESCE(
                    (SELECT MIN(b.booked_at) FROM bookings b
                      WHERE b.thesis_id = t.id AND b.status IN ('BOOKED', 'COMPLETED')),
                    t.updated_at, t.registered_at)
                WHEN 'PROTOTYPE_REVIEWED' THEN COALESCE(t.prototype_reviewed_at, t.updated_at, t.registered_at)
                WHEN 'SUPERVISOR_ASSIGNED' THEN COALESCE(t.supervisor_assigned_at, t.updated_at, t.registered_at)
                ELSE COALESCE(t.updated_at, t.registered_at)
            END
            WHERE t.stage_entered_at IS NULL
            """;

    private static final String INSERT_INFERRED_HISTORY = """
            WITH targets AS (
                SELECT t.id, t.status, t.registered_at, t.prototype_reviewed_at, t.supervisor_assigned_at,
                       t.stage_entered_at, array_position(%1$s, t.status::varchar) AS current_pos
                FROM theses t
                WHERE NOT EXISTS (SELECT 1 FROM thesis_stage_history h WHERE h.thesis_id = t.id)
            ),
            events AS (
                SELECT id AS thesis_id, 'REGISTERED' AS status, registered_at AS entered_at, 1 AS pos
                  FROM targets WHERE current_pos > 1
                UNION ALL
                SELECT t.id, 'PROTOTYPE_PENDING',
                       (SELECT MIN(b.booked_at) FROM bookings b
                         WHERE b.thesis_id = t.id AND b.status IN ('BOOKED', 'COMPLETED')), 2
                  FROM targets t WHERE t.current_pos > 2
                UNION ALL
                SELECT id, 'PROTOTYPE_REVIEWED', prototype_reviewed_at, 3
                  FROM targets WHERE current_pos > 3
                UNION ALL
                SELECT id, 'SUPERVISOR_ASSIGNED', supervisor_assigned_at, 4
                  FROM targets WHERE current_pos > 4
                UNION ALL
                SELECT id, status, stage_entered_at, current_pos
                  FROM targets
            )
            INSERT INTO thesis_stage_history (id, thesis_id, status, entered_at, exited_at, source)
            SELECT gen_random_uuid(), thesis_id, status, entered_at,
                   LEAD(entered_at) OVER (PARTITION BY thesis_id ORDER BY pos),
                   'INFERRED'
            FROM events
            WHERE entered_at IS NOT NULL
            """.formatted(STAGE_ORDER);

    private final JdbcTemplate jdbcTemplate;

    public StageHistoryBackfill(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        backfill();
    }

    @Transactional
    public void backfill() {
        int filled = jdbcTemplate.update(FILL_STAGE_ENTERED_AT);
        int inserted = jdbcTemplate.update(INSERT_INFERRED_HISTORY);
        if (filled > 0 || inserted > 0) {
            log.info("Stage history backfill: set stage_entered_at on {} theses, inferred {} history rows",
                    filled, inserted);
        }
    }
}
