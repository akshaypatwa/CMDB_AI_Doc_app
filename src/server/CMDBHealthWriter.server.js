/**
 * CMDBHealthWriter — Script Include
 *
 * Responsible for all GlideRecord writes to the scoped health_record table.
 * It is the single point of persistence for the two-phase CMDB health evaluation pipeline:
 *
 *   Phase 1 (Evaluation)  — save() with targetStatus='evaluated'
 *     Writes structured scores (correctness, completeness, compliance), staleness/orphan/duplicate
 *     flags, violation counts, and the raw merged payload JSON.  Also computes and stores the
 *     score delta relative to the previous run.
 *
 *   Phase 2 (LLM Analysis) — save() with targetStatus='complete'
 *     Adds the LLM-generated summary, priority action, auto-fix / review action lists, risk
 *     counts, per-dimension narrative summaries, field-level review chips, and compliance detail.
 *
 * Additional lifecycle helpers:
 *   markEvaluating(ciSysId)            — stamps run_status='evaluating' and records job_started_at
 *   updateStage(ciSysId, stage)        — lightweight mid-run progress stamp (no score writes)
 *   markFailed(ciSysId, errorMessage)  — stamps run_status='failed', writes error_log, increments retry_count
 *
 * The table name and field prefix are derived at runtime from gs.getCurrentScopeName() so the
 * class works in any scoped application without hardcoding the scope.
 */
var CMDBHealthWriter = Class.create()
CMDBHealthWriter.prototype = {
    initialize: function () {
        // Writer reads scope from gs.getCurrentScopeName() so it never hardcodes it
        var scope = gs.getCurrentScopeName()
        this.TABLE = scope + '_health_record'
        this.F = scope + '_' // field prefix shorthand
    },

    // ── Stage helper — call this from anywhere to stamp the current step ──
    updateStage: function (ciSysId, stage) {
        try {
            var now = new GlideDateTime()
            gs.info('[CMDBHealthWriter] Stage update for CI ' + ciSysId + ': ' + stage)
            var gr = new GlideRecord(this.TABLE)
            gr.addQuery(this.F + 'ci', ciSysId)
            gr.query()
            if (!gr.next()) return
            gr.setValue(this.F + 'last_stage', stage)
            gr.setValue(this.F + 'stage_updated_at', now)
            gr.update()
        } catch (e) {
            gs.error('[CMDBHealthWriter] updateStage error for CI ' + ciSysId + ': ' + e.message)
        }
    },

    // targetStatus: 'evaluated' or 'complete'
    save: function (ciSysId, mergedPayload, llmResponse, targetStatus) {
        var now = new GlideDateTime()
        gs.info('[CMDBHealthWriter] Saving record for CI: ' + ciSysId + ' — target status: ' + targetStatus)
        try {
            var gr = new GlideRecord(this.TABLE)
            gr.addQuery(this.F + 'ci', ciSysId)
            gr.query()

            var isNew = !gr.next()
            if (isNew) gr.initialize()

            // ── Score delta — read BEFORE overwriting ─────────────────
            var previousScore = null
            var scoreDelta = null
            if (!isNew) {
                var oldScore = gr.getValue(this.F + 'overall_health_score')
                if (oldScore !== null && oldScore !== '') {
                    previousScore = parseInt(oldScore, 10)
                }
            }

            // ── Write from mergedPayload (Phase 1 fields) ─────────────
            if (mergedPayload) {
                var scores = mergedPayload.scores || {}
                var correct = mergedPayload.correctness || {}
                var comp = mergedPayload.completeness || {}
                var compli = mergedPayload.compliance || {}

                gr.setValue(this.F + 'ci', ciSysId)
                gr.setValue(this.F + 'ci_class', mergedPayload.ci ? mergedPayload.ci.ci_class : '')
                gr.setValue(this.F + 'environment', mergedPayload.ci ? mergedPayload.ci.environment : '')
                gr.setValue(this.F + 'analysis_date', now)
                gr.setValue(this.F + 'overall_health_score', scores.overall || 0)
                gr.setValue(this.F + 'health_status', scores.health_status || '')
                gr.setValue(this.F + 'correctness_score', scores.correctness || 0)
                gr.setValue(this.F + 'completeness_score', scores.completeness || 0)
                gr.setValue(this.F + 'compliance_score', scores.compliance || 0)
                gr.setValue(this.F + 'is_stale', correct.is_stale || false)
                gr.setValue(this.F + 'is_orphan', correct.is_orphan || false)
                gr.setValue(
                    this.F + 'has_duplicates',
                    (correct.duplicates && correct.duplicates.qualified_count > 0) || false
                )
                gr.setValue(this.F + 'duplicate_count', (correct.duplicates && correct.duplicates.qualified_count) || 0)
                gr.setValue(this.F + 'violations_count', compli.violations_count || 0)
                gr.setValue(this.F + 'missing_fields_count', comp.missing_count || 0)
                gr.setValue(this.F + 'raw_payload_json', JSON.stringify(mergedPayload))

                // Score delta
                if (previousScore !== null) {
                    scoreDelta = (scores.overall || 0) - previousScore
                    gr.setValue(this.F + 'previous_score', previousScore)
                    gr.setValue(this.F + 'score_delta', scoreDelta)
                }
            }

            // ── Write from llmResponse (Phase 2 fields) ───────────────
            if (llmResponse) {
                var reviewItems = llmResponse.review_required || []
                var autofixItems = llmResponse.auto_fix_actions || []
                var correctNotes = llmResponse.correctness_notes || {}
                var compNotes = llmResponse.completeness_notes || {}
                var compliNotes = llmResponse.compliance_notes || {}

                // ── Core LLM output ──────────────────────────────────
                gr.setValue(this.F + 'llm_summary', llmResponse.llm_summary || '')
                gr.setValue(this.F + 'priority_action', llmResponse.priority_action || '')
                gr.setValue(this.F + 'autofix_actions', JSON.stringify(autofixItems))
                gr.setValue(this.F + 'review_actions', JSON.stringify(reviewItems))
                gr.setValue(this.F + 'full_llm_response', JSON.stringify(llmResponse))

                // ── Portal card surface — action count badges ─────────
                gr.setValue(this.F + 'review_actions_count', reviewItems.length)
                gr.setValue(this.F + 'autofix_actions_count', autofixItems.length)

                // High-risk count: items where risk === 'HIGH' across both lists
                var highRisk = 0
                for (var i = 0; i < reviewItems.length; i++) {
                    if (reviewItems[i].risk === 'HIGH') highRisk++
                }
                for (var j = 0; j < autofixItems.length; j++) {
                    if (autofixItems[j].risk === 'HIGH') highRisk++
                }
                gr.setValue(this.F + 'high_risk_count', highRisk)

                // ── Portal expanded view — dimension summaries ────────
                // Correctness: combine staleness + duplicate context into one narrative
                var corSummaryParts = []
                if (correctNotes.staleness_decision) corSummaryParts.push(correctNotes.staleness_decision)
                if (correctNotes.duplicate_summary) corSummaryParts.push(correctNotes.duplicate_summary)
                gr.setValue(this.F + 'correctness_summary', corSummaryParts.join(' | ').substring(0, 1000))

                gr.setValue(this.F + 'completeness_summary', (compNotes.summary || '').substring(0, 500))
                gr.setValue(this.F + 'compliance_summary', (compliNotes.summary || '').substring(0, 500))

                // ── Portal expanded view — field-level chips ──────────
                var fieldsReview = compNotes.fields_review || []
                gr.setValue(this.F + 'fields_review', fieldsReview.join(', ').substring(0, 500))

                // ── Compliance detail ─────────────────────────────────
                gr.setValue(this.F + 'regulatory_risk', compliNotes.regulatory_risk || false)
                gr.setValue(this.F + 'templates_checked', compliNotes.templates_checked || 0)
            }

            // ── Status & stage stamp ──────────────────────────────────
            var status = targetStatus || 'complete'
            gr.setValue(this.F + 'run_status', status)
            gr.setValue(this.F + 'stage_updated_at', now)

            if (status === 'evaluated') {
                gr.setValue(this.F + 'last_stage', 'Phase 1 complete — evaluation saved, queued for LLM')
                gs.info(
                    '[CMDBHealthWriter] CI ' +
                        ciSysId +
                        ' — Phase 1 DONE. Scores: overall=' +
                        (mergedPayload && mergedPayload.scores ? mergedPayload.scores.overall : 'n/a')
                )
            } else if (status === 'complete') {
                gr.setValue(this.F + 'last_stage', 'Phase 2 complete — LLM analysis saved')
                gr.setValue(this.F + 'job_completed_at', now)
                gs.info('[CMDBHealthWriter] CI ' + ciSysId + ' — Phase 2 DONE. LLM summary written.')
            } else {
                gr.setValue(this.F + 'last_stage', 'Saving — status: ' + status)
            }

            // ── Save ──────────────────────────────────────────────────
            if (isNew) {
                gr.insert()
                gs.info('[CMDBHealthWriter] Inserted new record for CI: ' + ciSysId)
            } else {
                gr.update()
                gs.info('[CMDBHealthWriter] Updated record for CI: ' + ciSysId + ' — status: ' + status)
            }

            return true
        } catch (e) {
            gs.error(
                '[CMDBHealthWriter] save() failed for CI ' + ciSysId + ' (status=' + targetStatus + '): ' + e.message
            )
            return false
        }
    },

    markFailed: function (ciSysId, errorMessage) {
        var now = new GlideDateTime()
        gs.error('[CMDBHealthWriter] Marking CI ' + ciSysId + ' as FAILED. Reason: ' + errorMessage)
        try {
            var gr = new GlideRecord(this.TABLE)
            gr.addQuery(this.F + 'ci', ciSysId)
            gr.query()
            if (!gr.next()) return
            gr.setValue(this.F + 'run_status', 'failed')
            gr.setValue(this.F + 'error_log', errorMessage)
            gr.setValue(this.F + 'last_stage', 'FAILED — ' + errorMessage.substring(0, 200))
            gr.setValue(this.F + 'stage_updated_at', now)
            gr.setValue(this.F + 'job_completed_at', now)
            var currentRetry = parseInt(gr.getValue(this.F + 'retry_count') || '0', 10)
            gr.setValue(this.F + 'retry_count', currentRetry + 1)
            gr.update()
            gs.error('[CMDBHealthWriter] CI ' + ciSysId + ' marked FAILED (retry_count now ' + (currentRetry + 1) + ')')
        } catch (e) {
            gs.error('[CMDBHealthWriter] markFailed error for CI ' + ciSysId + ': ' + e.message)
        }
    },

    markEvaluating: function (ciSysId) {
        var now = new GlideDateTime()
        gs.info('[CMDBHealthWriter] Marking CI ' + ciSysId + ' as EVALUATING')
        try {
            var gr = new GlideRecord(this.TABLE)
            gr.addQuery(this.F + 'ci', ciSysId)
            gr.query()
            if (!gr.next()) return
            gr.setValue(this.F + 'run_status', 'evaluating')
            gr.setValue(this.F + 'last_stage', 'Phase 1 — Evaluation started')
            gr.setValue(this.F + 'stage_updated_at', now)
            gr.setValue(this.F + 'job_started_at', now)
            gr.update()
            gs.info('[CMDBHealthWriter] CI ' + ciSysId + ' — job_started_at set to ' + now.getDisplayValue())
        } catch (e) {
            gs.error('[CMDBHealthWriter] markEvaluating error for CI ' + ciSysId + ': ' + e.message)
        }
    },

    type: 'CMDBHealthWriter',
}
