(function() {

    // ─── Helper: split + dedupe comma-separated CI names ──────
    function parseCiNames(raw) {
        var out = [];
        var seen = {};
        var parts = (raw || '').split(',');
        for (var i = 0; i < parts.length; i++) {
            var n = (parts[i] || '').trim();
            if (n && !seen[n.toLowerCase()]) {
                seen[n.toLowerCase()] = true;
                out.push(n);
            }
        }
        return out;
    }

    // ─── Action handler: Verify CI names exist in CMDB ────────
    if (input && input.action === 'verify_cis') {
        data.verifyResult = { found: [], missing: [], alreadyAdded: [] };
        var vNames = parseCiNames(input.ci_names);
        for (var vi = 0; vi < vNames.length; vi++) {
            var vName = vNames[vi];
            var vGr = new GlideRecord('cmdb_ci');
            vGr.addQuery('name', vName);
            vGr.setLimit(1);
            vGr.query();
            if (vGr.next()) {
                var vSysId = vGr.getUniqueValue();
                var dupGr = new GlideRecord('x_epams_cmdb_healt_health_record');
                dupGr.addQuery('x_epams_cmdb_healt_ci', vSysId);
                dupGr.setLimit(1);
                dupGr.query();
                if (dupGr.next()) {
                    data.verifyResult.alreadyAdded.push(vName);
                } else {
                    data.verifyResult.found.push(vName);
                }
            } else {
                data.verifyResult.missing.push(vName);
            }
        }
    }

    // ─── Action handler: Add verified CIs to watchlist ────────
    if (input && input.action === 'add_cis') {
        data.addResult = { success: false, message: '', addedCount: 0, skippedCount: 0 };
        var aNames = parseCiNames(input.ci_names);
        if (aNames.length === 0) {
            data.addResult.message = 'No CI names provided.';
        } else {
            var added = 0;
            var skipped = 0;
            var notFound = [];
            for (var ai = 0; ai < aNames.length; ai++) {
                var aName = aNames[ai];
                var aGr = new GlideRecord('cmdb_ci');
                aGr.addQuery('name', aName);
                aGr.setLimit(1);
                aGr.query();
                if (!aGr.next()) {
                    notFound.push(aName);
                    continue;
                }
                var aSysId = aGr.getUniqueValue();
                var aDup = new GlideRecord('x_epams_cmdb_healt_health_record');
                aDup.addQuery('x_epams_cmdb_healt_ci', aSysId);
                aDup.setLimit(1);
                aDup.query();
                if (aDup.next()) {
                    skipped++;
                    continue;
                }
                var newRec = new GlideRecord('x_epams_cmdb_healt_health_record');
                newRec.setValue('x_epams_cmdb_healt_ci', aSysId);
                newRec.setValue('x_epams_cmdb_healt_run_status', 'new');
                newRec.insert();
                added++;
            }
            data.addResult.addedCount = added;
            data.addResult.skippedCount = skipped;
            data.addResult.success = (added > 0 && notFound.length === 0);
            var msgParts = [];
            if (added > 0)        { msgParts.push(added + ' added'); }
            if (skipped > 0)      { msgParts.push(skipped + ' already on watchlist'); }
            if (notFound.length)  { msgParts.push(notFound.length + ' not found: ' + notFound.join(', ')); }
            data.addResult.message = msgParts.join(' · ') || 'No changes.';
        }
    }

    // ─── Always reload records on every server.update() ───────
    data.records = [];
    data.summary = { total: 0, critical: 0, moderate: 0, minor: 0, healthy: 0, lastRun: '' };

    var gr = new GlideRecord('x_epams_cmdb_healt_health_record');
    gr.addQuery('x_epams_cmdb_healt_run_status', 'complete');
    gr.orderBy('x_epams_cmdb_healt_overall_health_score');
    gr.setLimit(100);
    gr.query();

    while (gr.next()) {
        var rec = {};
        rec.sys_id               = gr.getUniqueValue();
        rec.ci_name              = gr.getDisplayValue('x_epams_cmdb_healt_ci');
        rec.ci_sys_id            = gr.getValue('x_epams_cmdb_healt_ci');
        rec.ci_class             = gr.getValue('x_epams_cmdb_healt_ci_class');
        rec.environment          = gr.getValue('x_epams_cmdb_healt_environment');
        rec.overall_score        = parseInt(gr.getValue('x_epams_cmdb_healt_overall_health_score') || '0', 10);
        rec.health_status        = gr.getValue('x_epams_cmdb_healt_health_status');
        rec.correctness_score    = parseInt(gr.getValue('x_epams_cmdb_healt_correctness_score') || '0', 10);
        rec.completeness_score   = parseInt(gr.getValue('x_epams_cmdb_healt_completeness_score') || '0', 10);
        rec.compliance_score     = parseInt(gr.getValue('x_epams_cmdb_healt_compliance_score') || '0', 10);
        rec.previous_score       = parseInt(gr.getValue('x_epams_cmdb_healt_previous_score') || '0', 10);
        rec.score_delta          = parseInt(gr.getValue('x_epams_cmdb_healt_score_delta') || '0', 10);
        rec.is_stale             = gr.getValue('x_epams_cmdb_healt_is_stale') === '1';
        rec.is_orphan            = gr.getValue('x_epams_cmdb_healt_is_orphan') === '1';
        rec.duplicate_count      = parseInt(gr.getValue('x_epams_cmdb_healt_duplicate_count') || '0', 10);
        rec.violations_count     = parseInt(gr.getValue('x_epams_cmdb_healt_violations_count') || '0', 10);
        rec.missing_fields_count = parseInt(gr.getValue('x_epams_cmdb_healt_missing_fields_count') || '0', 10);
        rec.regulatory_risk      = gr.getValue('x_epams_cmdb_healt_regulatory_risk') === '1';
        rec.llm_summary          = gr.getValue('x_epams_cmdb_healt_llm_summary');
        rec.priority_action      = gr.getValue('x_epams_cmdb_healt_priority_action');
        rec.correctness_summary  = gr.getValue('x_epams_cmdb_healt_correctness_summary');
        rec.completeness_summary = gr.getValue('x_epams_cmdb_healt_completeness_summary');
        rec.compliance_summary   = gr.getValue('x_epams_cmdb_healt_compliance_summary');
        rec.review_actions_count = parseInt(gr.getValue('x_epams_cmdb_healt_review_actions_count') || '0', 10);
        rec.analysis_date        = gr.getDisplayValue('x_epams_cmdb_healt_analysis_date');
        rec.templates_checked    = parseInt(gr.getValue('x_epams_cmdb_healt_templates_checked') || '0', 10);

        rec.review_actions = [];
        try {
            var ra = gr.getValue('x_epams_cmdb_healt_review_actions');
            if (ra) { rec.review_actions = JSON.parse(ra); }
        } catch(e) { rec.review_actions = []; }

        data.records.push(rec);
        data.summary.total++;
        if (rec.health_status === 'critical') { data.summary.critical++; }
        if (rec.health_status === 'moderate') { data.summary.moderate++; }
        if (rec.health_status === 'minor')    { data.summary.minor++; }
        if (rec.health_status === 'healthy')  { data.summary.healthy++; }
    }

    var jobGr = new GlideRecord('x_epams_cmdb_healt_health_record');
    jobGr.addQuery('x_epams_cmdb_healt_run_status', 'complete');
    jobGr.orderByDesc('x_epams_cmdb_healt_job_completed_at');
    jobGr.setLimit(1);
    jobGr.query();
    if (jobGr.next()) {
        data.summary.lastRun = jobGr.getDisplayValue('x_epams_cmdb_healt_job_completed_at');
    }
})();
