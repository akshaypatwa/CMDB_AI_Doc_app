(function() {

    // ─── Action handler: Add CI to watchlist ──────────────────
    if (input && input.action === 'add_ci') {
        data.addResult = { success: false, message: '' };
        var ciName = input.ci_name || '';

        if (!ciName) {
            data.addResult.message = 'CI name is required.';
        } else {
            var ciGr = new GlideRecord('cmdb_ci');
            ciGr.addQuery('name', ciName);
            ciGr.setLimit(1);
            ciGr.query();

            if (!ciGr.next()) {
                data.addResult.message = 'CI "' + ciName + '" not found in CMDB. Check the name and try again.';
            } else {
                var ciSysId = ciGr.getUniqueValue();
                var existGr = new GlideRecord('x_epams_cmdb_healt_health_record');
                existGr.addQuery('x_epams_cmdb_healt_ci', ciSysId);
                existGr.setLimit(1);
                existGr.query();

                if (existGr.next()) {
                    data.addResult.message = 'CI "' + ciName + '" is already in the health watchlist.';
                } else {
                    var newRec = new GlideRecord('x_epams_cmdb_healt_health_record');
                    newRec.setValue('x_epams_cmdb_healt_ci', ciSysId);
                    newRec.setValue('x_epams_cmdb_healt_run_status', 'new');
                    newRec.insert();
                    data.addResult.success = true;
                    data.addResult.message = 'CI "' + ciName + '" added. It will be evaluated on the next scheduled run.';
                }
            }
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
