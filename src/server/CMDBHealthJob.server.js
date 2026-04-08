// CMDB Health Doctor — Nightly Evaluation Job
// Deployed via SDK as sysauto_script. Do NOT edit this record in ServiceNow directly.
//
// Phase 1: For each CI that is NEW / FAILED (retry < 3) / COMPLETE (Sundays):
//          evaluate CCC scores and write status = EVALUATED
// Phase 2: For each CI that is EVALUATED:
//          call LLM and write status = COMPLETE

(function runCMDBHealthJob() {
    var scope = gs.getCurrentScopeName();
    var TABLE = scope + '_health_record';
    var F     = scope + '_';

    var jobStart = new GlideDateTime();
    gs.info('[CMDBHealthJob] ================================================================');
    gs.info('[CMDBHealthJob] CMDB Health Doctor — Job STARTED at ' + jobStart.getDisplayValue() + ' | scope: ' + scope);
    gs.info('[CMDBHealthJob] ================================================================');

    // ── Instantiate Script Includes ──────────────────────────────────
    var writer;
    var evaluator;
    var llm;
    try {
        writer    = new CMDBHealthWriter();
        evaluator = new CMDBHealthEvaluator();
        llm       = new CMDBHealthLLM();
        gs.info('[CMDBHealthJob] Script Includes loaded: CMDBHealthWriter, CMDBHealthEvaluator, CMDBHealthLLM');
    } catch (initErr) {
        gs.error('[CMDBHealthJob] FATAL — failed to instantiate Script Includes: ' + initErr.message);
        gs.error('[CMDBHealthJob] Ensure CMDBHealthWriter, CMDBHealthEvaluator, CMDBHealthLLM are deployed and active.');
        return;
    }

    // ── Phase 1: Evaluation ──────────────────────────────────────────
    gs.info('[CMDBHealthJob] ----------------------------------------------------------------');
    gs.info('[CMDBHealthJob] PHASE 1: EVALUATION starting');
    gs.info('[CMDBHealthJob] ----------------------------------------------------------------');

    // Re-evaluate when: new, OR failed (retry<3), OR analysis_date older than 24h.
    var dayAgo = new GlideDateTime();
    dayAgo.addSeconds(-86400);

    var gr1 = new GlideRecord(TABLE);
    var cond1 = gr1.addQuery(F + 'run_status', 'new');
    var retryP1 = cond1.addOrCondition(F + 'run_status', 'failed');
    retryP1.addCondition(F + 'retry_count', '<', 3);
    cond1.addOrCondition(F + 'analysis_date', '<', dayAgo);
    gr1.query();

    var p1Total   = gr1.getRowCount();
    var p1Success = 0;
    var p1Failed  = 0;
    gs.info('[CMDBHealthJob] Phase 1 — CIs queued: ' + p1Total +
        ' (new + failed<3retry + analysis_date>24h)');

    if (p1Total === 0) {
        gs.info('[CMDBHealthJob] Phase 1 — No CIs to evaluate. Skipping.');
    }

    // Collect first to release the cursor before slow per-CI work.
    var p1Rows = [];
    while (gr1.next()) {
        p1Rows.push({
            ciSysId:    gr1.getValue(F + 'ci'),
            ciName:     gr1.getDisplayValue(F + 'ci'),
            prevStatus: gr1.getValue(F + 'run_status'),
            retryCount: gr1.getValue(F + 'retry_count') || 0,
        });
    }

    var p1Idx = 0;
    for (var i1 = 0; i1 < p1Rows.length; i1++) {
        p1Idx++;
        var ciSysId    = p1Rows[i1].ciSysId;
        var ciName     = p1Rows[i1].ciName;
        var prevStatus = p1Rows[i1].prevStatus;
        var retryCount = p1Rows[i1].retryCount;

        gs.info('[CMDBHealthJob] Phase 1 [' + p1Idx + '/' + p1Total + '] CI: "' + ciName + '" (' + ciSysId + ') prev_status=' + prevStatus + ' retry=' + retryCount);

        try {
            writer.markEvaluating(ciSysId);

            var result = evaluator.evaluate(ciSysId);
            if (!result) {
                gs.error('[CMDBHealthJob] Phase 1 — evaluate() returned null for "' + ciName + '" (' + ciSysId + '). Marking FAILED.');
                writer.markFailed(ciSysId, 'evaluate() returned null — CI may not exist or its class table is missing');
                p1Failed++;
                continue;
            }

            var saved = writer.save(ciSysId, result.mergedPayload, null, 'evaluated');
            if (!saved) {
                gs.error('[CMDBHealthJob] Phase 1 — writer.save() returned false for "' + ciName + '". Marking FAILED.');
                writer.markFailed(ciSysId, 'writer.save() returned false after evaluation');
                p1Failed++;
                continue;
            }

            gs.info('[CMDBHealthJob] Phase 1 [' + p1Idx + '/' + p1Total + '] DONE: "' + ciName +
                '" overall=' + result.scores.overall +
                ' status=' + result.scores.healthStatus +
                ' correctness=' + result.scores.correctness +
                ' completeness=' + result.scores.completeness +
                ' compliance=' + result.scores.compliance);
            p1Success++;

        } catch (e) {
            gs.error('[CMDBHealthJob] Phase 1 — EXCEPTION for "' + ciName + '" (' + ciSysId + '): ' + e.message);
            try { writer.markFailed(ciSysId, 'Phase 1 exception: ' + e.message); } catch (we) { /* ignore */ }
            p1Failed++;
        }
    }

    gs.info('[CMDBHealthJob] ----------------------------------------------------------------');
    gs.info('[CMDBHealthJob] PHASE 1 COMPLETE — total=' + p1Total + ' | success=' + p1Success + ' | failed=' + p1Failed);
    gs.info('[CMDBHealthJob] ----------------------------------------------------------------');

    // ── Phase 2: LLM Enrichment ──────────────────────────────────────
    gs.info('[CMDBHealthJob] ----------------------------------------------------------------');
    gs.info('[CMDBHealthJob] PHASE 2: LLM ENRICHMENT starting');
    gs.info('[CMDBHealthJob] ----------------------------------------------------------------');

    var twoHoursAgo = new GlideDateTime();
    twoHoursAgo.addSeconds(-7200);

    var gr2 = new GlideRecord(TABLE);
    var cond2 = gr2.addQuery(F + 'run_status', 'evaluated');
    var retryP2 = cond2.addOrCondition(F + 'run_status', 'failed');
    retryP2.addCondition(F + 'retry_count', '<', 3);
    retryP2.addCondition(F + 'analysis_date', '<', twoHoursAgo);
    gr2.query();

    var p2Total   = gr2.getRowCount();
    var p2Success = 0;
    var p2Failed  = 0;
    gs.info('[CMDBHealthJob] Phase 2 — CIs queued for LLM: ' + p2Total);

    if (p2Total === 0) {
        gs.info('[CMDBHealthJob] Phase 2 — No CIs to send to LLM. Skipping.');
    }

    // Collect first to release the cursor before each (slow) LLM call.
    var p2Rows = [];
    while (gr2.next()) {
        p2Rows.push({
            ci2SysId:    gr2.getValue(F + 'ci'),
            ci2Name:     gr2.getDisplayValue(F + 'ci'),
            rawPayload:  gr2.getValue(F + 'raw_payload_json'),
            retryCount2: gr2.getValue(F + 'retry_count') || 0,
        });
    }

    var p2Idx = 0;
    for (var i2 = 0; i2 < p2Rows.length; i2++) {
        p2Idx++;
        var ci2SysId    = p2Rows[i2].ci2SysId;
        var ci2Name     = p2Rows[i2].ci2Name;
        var rawPayload  = p2Rows[i2].rawPayload;
        var retryCount2 = p2Rows[i2].retryCount2;

        gs.info('[CMDBHealthJob] Phase 2 [' + p2Idx + '/' + p2Total + '] CI: "' + ci2Name + '" (' + ci2SysId + ') retry=' + retryCount2);

        if (!rawPayload) {
            gs.error('[CMDBHealthJob] Phase 2 — raw_payload_json is EMPTY for "' + ci2Name + '" (' + ci2SysId + '). Cannot send to LLM. Marking FAILED.');
            writer.markFailed(ci2SysId, 'Phase 2: raw_payload_json is empty — re-run Phase 1 for this CI');
            p2Failed++;
            continue;
        }

        try {
            var payload = JSON.parse(rawPayload);
            gs.info('[CMDBHealthJob] Phase 2 [' + p2Idx + '/' + p2Total + '] Sending to LLM: "' + ci2Name + '"...');

            var llmResponse = llm.call(payload);
            if (!llmResponse || llmResponse.ok === false) {
                var failReason = (llmResponse && llmResponse.reason) ? llmResponse.reason : 'LLM call returned null';
                gs.error('[CMDBHealthJob] Phase 2 — LLM failed for "' + ci2Name + '": ' + failReason);
                writer.markFailed(ci2SysId, 'Phase 2: ' + failReason);
                p2Failed++;
                continue;
            }

            var saved2 = writer.save(ci2SysId, null, llmResponse, 'complete');
            if (!saved2) {
                gs.error('[CMDBHealthJob] Phase 2 — writer.save() returned false for "' + ci2Name + '"');
                writer.markFailed(ci2SysId, 'Phase 2: writer.save() returned false after LLM response');
                p2Failed++;
                continue;
            }

            gs.info('[CMDBHealthJob] Phase 2 [' + p2Idx + '/' + p2Total + '] COMPLETE: "' + ci2Name + '"');
            p2Success++;

        } catch (e) {
            gs.error('[CMDBHealthJob] Phase 2 — EXCEPTION for "' + ci2Name + '" (' + ci2SysId + '): ' + e.message);
            try { writer.markFailed(ci2SysId, 'Phase 2 exception: ' + e.message); } catch (we) { /* ignore */ }
            p2Failed++;
        }
    }

    gs.info('[CMDBHealthJob] ----------------------------------------------------------------');
    gs.info('[CMDBHealthJob] PHASE 2 COMPLETE — total=' + p2Total + ' | success=' + p2Success + ' | failed=' + p2Failed);
    gs.info('[CMDBHealthJob] ----------------------------------------------------------------');

    // ── Final Summary ────────────────────────────────────────────────
    var jobEnd     = new GlideDateTime();
    var elapsedSec = Math.round((jobEnd.getNumericValue() - jobStart.getNumericValue()) / 1000);

    gs.info('[CMDBHealthJob] ================================================================');
    gs.info('[CMDBHealthJob] CMDB Health Doctor — Job FINISHED at ' + jobEnd.getDisplayValue());
    gs.info('[CMDBHealthJob] Total elapsed: ' + elapsedSec + 's');
    gs.info('[CMDBHealthJob] Phase 1 (Evaluation): ' + p1Success + ' succeeded, ' + p1Failed + ' failed out of ' + p1Total);
    gs.info('[CMDBHealthJob] Phase 2 (LLM):        ' + p2Success + ' succeeded, ' + p2Failed + ' failed out of ' + p2Total);
    if (p1Failed > 0 || p2Failed > 0) {
        gs.warn('[CMDBHealthJob] ' + (p1Failed + p2Failed) + ' CI(s) failed — check records with run_status=failed in ' + TABLE);
    } else {
        gs.info('[CMDBHealthJob] All CIs processed successfully.');
    }
    gs.info('[CMDBHealthJob] ================================================================');

})();
