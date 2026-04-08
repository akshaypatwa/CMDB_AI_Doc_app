(function() {
    data.summary = {
        total: 0, critical: 0, moderate: 0, minor: 0, healthy: 0,
        lastRun: '', hasCritical: false
    };

    var agg = new GlideAggregate('x_epams_cmdb_healt_health_record');
    agg.addQuery('x_epams_cmdb_healt_run_status', 'complete');
    agg.addAggregate('COUNT', 'x_epams_cmdb_healt_health_status');
    agg.groupBy('x_epams_cmdb_healt_health_status');
    agg.query();

    while (agg.next()) {
        var status = agg.getValue('x_epams_cmdb_healt_health_status');
        var count  = parseInt(agg.getAggregate('COUNT', 'x_epams_cmdb_healt_health_status'), 10);
        data.summary.total += count;
        if (status === 'critical') { data.summary.critical = count; data.summary.hasCritical = true; }
        if (status === 'moderate') { data.summary.moderate = count; }
        if (status === 'minor')    { data.summary.minor    = count; }
        if (status === 'healthy')  { data.summary.healthy  = count; }
    }

    var lastGr = new GlideRecord('x_epams_cmdb_healt_health_record');
    lastGr.addQuery('x_epams_cmdb_healt_run_status', 'complete');
    lastGr.orderByDesc('x_epams_cmdb_healt_job_completed_at');
    lastGr.setLimit(1);
    lastGr.query();
    if (lastGr.next()) {
        data.summary.lastRun = lastGr.getDisplayValue('x_epams_cmdb_healt_job_completed_at');
    }
})();
