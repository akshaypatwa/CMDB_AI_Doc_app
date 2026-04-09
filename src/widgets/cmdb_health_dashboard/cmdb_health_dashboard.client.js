api.controller = function($scope, spUtil, $timeout, $http) {

    // ─── Initial state ────────────────────────────────────────
    $scope.allRecords     = $scope.data.records || [];
    $scope.summary        = $scope.data.summary || {};
    $scope.environments   = ['All'];
    $scope.selectedEnv    = 'All';
    $scope.activeFilter   = 'all';
    $scope.searchQuery    = '';
    $scope.sortBy         = 'score_asc';
    $scope.expandedCard   = null;
    $scope.activeTab      = 'overview';
    $scope.setTab = function(tab, $event) {
        if ($event) { $event.stopPropagation(); }
        $scope.activeTab = tab;
    };
    $scope.scoresAnimated = false;
    $scope.openAccordions = {};
    $scope.toast          = null;
    $scope.showQuickFixes = false;

    // ─── Theme (dark / light) ─────────────────────────────────
    try {
        $scope.theme = localStorage.getItem('cmdb_theme') || 'dark';
    } catch (e) {
        $scope.theme = 'dark';
    }
    function applyThemeToHost(theme) {
        try {
            var body = document.body;
            var html = document.documentElement;
            body.classList.remove('cmdb-theme-light', 'cmdb-theme-dark');
            html.classList.remove('cmdb-theme-light', 'cmdb-theme-dark');
            body.classList.add('cmdb-theme-' + theme);
            html.classList.add('cmdb-theme-' + theme);
        } catch (e) {}
    }
    applyThemeToHost($scope.theme);
    $scope.toggleTheme = function() {
        $scope.theme = ($scope.theme === 'light') ? 'dark' : 'light';
        try { localStorage.setItem('cmdb_theme', $scope.theme); } catch (e) {}
        applyThemeToHost($scope.theme);
    };

    // ─── Per-card Quick-Fix side panel ────────────────────────
    $scope.quickPanelCard = null;
    $scope.openQuickPanel = function(record, $event) {
        if ($event) { $event.stopPropagation(); }
        $scope.quickPanelCard = record;
    };
    $scope.closeQuickPanel = function($event) {
        if ($event) { $event.stopPropagation(); }
        $scope.quickPanelCard = null;
    };
    $scope.isQuickPanelOpen = function(record) {
        return $scope.quickPanelCard && $scope.quickPanelCard.sys_id === record.sys_id;
    };
    $scope.getCardQuickFixes = function(record) {
        if (!record) { return []; }
        var fixes = [];
        if (record.review_actions && record.review_actions.length) {
            record.review_actions.forEach(function(a) {
                var risk = (a.risk || 'MEDIUM').toUpperCase();
                fixes.push({
                    risk:     risk,
                    riskIcon: $scope.getActionRiskIcon(risk),
                    color:    $scope.getActionRiskColor(risk),
                    issue:    a.title || 'Issue',
                    rec:      a.action || 'Review'
                });
            });
        } else {
            if (record.is_stale) {
                fixes.push({ risk: 'HIGH', riskIcon: '▲', color: '#fb8c00',
                    issue: 'Stale record', rec: 'Rediscover' });
            }
            if (record.is_orphan) {
                fixes.push({ risk: 'MEDIUM', riskIcon: '●', color: '#fdd835',
                    issue: 'No parent CI', rec: 'Relate to parent' });
            }
            if (record.duplicate_count > 0) {
                fixes.push({ risk: 'HIGH', riskIcon: '▲', color: '#fb8c00',
                    issue: record.duplicate_count + ' duplicate' + (record.duplicate_count > 1 ? 's' : ''),
                    rec: 'Retire duplicates' });
            }
            if (record.missing_fields_count > 0) {
                fixes.push({ risk: 'MEDIUM', riskIcon: '●', color: '#fdd835',
                    issue: record.missing_fields_count + ' field' + (record.missing_fields_count > 1 ? 's' : '') + ' missing',
                    rec: 'Populate required fields' });
            }
            if (record.violations_count > 0) {
                fixes.push({ risk: 'CRITICAL', riskIcon: '⚠', color: '#e53935',
                    issue: record.violations_count + ' policy violation' + (record.violations_count > 1 ? 's' : ''),
                    rec: 'Remediate to pass audit' });
            }
        }
        var riskOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        fixes.sort(function(a, b) { return (riskOrder[a.risk] || 9) - (riskOrder[b.risk] || 9); });
        return fixes;
    };

    // Add CI modal state
    $scope.showAddModal   = false;
    $scope.newCiNames     = '';
    $scope.addMessage     = '';
    $scope.addSuccess     = false;
    $scope.addLoading     = false;
    $scope.verifyLoading  = false;
    $scope.verified       = false;
    $scope.verifyResult   = null;
    $scope.onCiInputChange = function() {
        // Any edit invalidates prior verification
        $scope.verified     = false;
        $scope.verifyResult = null;
        $scope.addMessage   = '';
    };

    // Build environment dropdown dynamically
    var envMap = {};
    angular.forEach($scope.allRecords, function(r) {
        if (r.environment && !envMap[r.environment]) {
            envMap[r.environment] = true;
            $scope.environments.push(r.environment);
        }
    });

    // Kick off card score bar animation
    $timeout(function() { $scope.scoresAnimated = true; }, 200);

    // ─── Status helpers ───────────────────────────────────────
    $scope.getStatusColor = function(status) {
        var colors = {
            'critical': '#e53935',
            'moderate': '#fb8c00',
            'minor':    '#fdd835',
            'healthy':  '#43a047'
        };
        return colors[status] || '#546e7a';
    };

    $scope.getStatusLabel = function(status) {
        if (!status) { return 'UNKNOWN'; }
        var labels = {
            'critical': 'CRITICAL',
            'moderate': 'MODERATE',
            'minor':    'MINOR',
            'healthy':  'HEALTHY'
        };
        return labels[status] || status.toUpperCase();
    };

    // ─── Filter / search / sort ───────────────────────────────
    $scope.setFilter = function(status) {
        $scope.activeFilter = status;
    };

    $scope.getFilteredRecords = function() {
        var records = $scope.allRecords || [];
        var q = ($scope.searchQuery || '').toLowerCase();

        var filtered = records.filter(function(r) {
            var matchesStatus = ($scope.activeFilter === 'all') || (r.health_status === $scope.activeFilter);
            var matchesEnv    = ($scope.selectedEnv === 'All')  || (r.environment === $scope.selectedEnv);
            var matchesSearch = !q || (r.ci_name && r.ci_name.toLowerCase().indexOf(q) !== -1);
            return matchesStatus && matchesEnv && matchesSearch;
        });

        filtered.sort(function(a, b) {
            if ($scope.sortBy === 'score_asc')  { return a.overall_score - b.overall_score; }
            if ($scope.sortBy === 'score_desc') { return b.overall_score - a.overall_score; }
            if ($scope.sortBy === 'name')       { return (a.ci_name || '').localeCompare(b.ci_name || ''); }
            if ($scope.sortBy === 'date')       { return (b.analysis_date || '').localeCompare(a.analysis_date || ''); }
            return 0;
        });

        return filtered;
    };

    // ─── Card expand / collapse ───────────────────────────────
    $scope.toggleCard = function(record) {
        if ($scope.expandedCard && $scope.expandedCard.sys_id === record.sys_id) {
            $scope.expandedCard = null;
        } else {
            $scope.expandedCard = record;
            $scope.activeTab    = 'overview';
            // Re-kick bar animations inside the newly opened panel
            $scope.scoresAnimated = false;
            $timeout(function() { $scope.scoresAnimated = true; }, 60);
        }
    };

    $scope.isExpanded = function(record) {
        return $scope.expandedCard && $scope.expandedCard.sys_id === record.sys_id;
    };

    // ─── Accordion ────────────────────────────────────────────
    $scope.toggleAccordion = function(key) {
        $scope.openAccordions[key] = !$scope.openAccordions[key];
    };

    $scope.isAccordionOpen = function(key) {
        return !!$scope.openAccordions[key];
    };

    // ─── Dimension score color ────────────────────────────────
    $scope.getDimColor = function(score) {
        var s = parseInt(score, 10);
        if (isNaN(s)) { return '#546e7a'; }
        if (s >= 80)  { return '#43a047'; }
        if (s >= 60)  { return '#fdd835'; }
        if (s >= 40)  { return '#fb8c00'; }
        return '#e53935';
    };

    // ─── Action risk color / icon ─────────────────────────────
    $scope.getActionRiskColor = function(risk) {
        var map = { 'CRITICAL': '#e53935', 'HIGH': '#fb8c00', 'MEDIUM': '#fdd835', 'LOW': '#43a047' };
        return map[risk] || '#546e7a';
    };

    $scope.getActionRiskIcon = function(risk) {
        var map = { 'CRITICAL': '⚠', 'HIGH': '▲', 'MEDIUM': '●', 'LOW': '○' };
        return map[risk] || '·';
    };

    // ─── Score delta indicator ────────────────────────────────
    $scope.getDeltaIcon = function(delta) {
        if (delta === null || delta === undefined || delta === '') { return '→'; }
        var d = parseInt(delta, 10);
        if (isNaN(d)) { return '→'; }
        if (d > 0) { return '↑'; }
        if (d < 0) { return '↓'; }
        return '→';
    };

    $scope.getDeltaColor = function(delta) {
        if (delta === null || delta === undefined || delta === '') { return '#546e7a'; }
        var d = parseInt(delta, 10);
        if (isNaN(d)) { return '#546e7a'; }
        if (d > 0) { return '#43a047'; }
        if (d < 0) { return '#e53935'; }
        return '#546e7a';
    };

    // ─── Quick Fixes FAB ──────────────────────────────────────
    $scope.toggleQuickFixes = function() {
        $scope.showQuickFixes = !$scope.showQuickFixes;
    };

    var _quickFixCache = null;
    var _quickFixCacheKey = null;

    $scope.getQuickFixes = function() {
        var records = $scope.allRecords || [];
        var key = records.length + ':' + ($scope.expandedCard ? $scope.expandedCard.sys_id : '');
        if (_quickFixCache && _quickFixCacheKey === key) { return _quickFixCache; }

        var riskOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
        var fixes = [];

        records.forEach(function(r) {
            // Prefer LLM review_actions (issue → recommendation pairs)
            if (r.review_actions && r.review_actions.length) {
                r.review_actions.forEach(function(a) {
                    fixes.push({
                        record:   r,
                        ciName:   r.ci_name,
                        risk:     (a.risk || 'MEDIUM').toUpperCase(),
                        riskIcon: $scope.getActionRiskIcon((a.risk || 'MEDIUM').toUpperCase()),
                        color:    $scope.getActionRiskColor((a.risk || 'MEDIUM').toUpperCase()),
                        issue:    a.title || 'Issue',
                        rec:      a.action || 'Review'
                    });
                });
            } else {
                // Derived fallbacks
                if (r.is_stale) {
                    fixes.push({ record: r, ciName: r.ci_name, risk: 'HIGH',
                        riskIcon: '▲', color: '#fb8c00',
                        issue: 'Stale record', rec: 'Rediscover' });
                }
                if (r.is_orphan) {
                    fixes.push({ record: r, ciName: r.ci_name, risk: 'MEDIUM',
                        riskIcon: '●', color: '#fdd835',
                        issue: 'No parent CI', rec: 'Relate to parent' });
                }
                if (r.duplicate_count > 0) {
                    fixes.push({ record: r, ciName: r.ci_name, risk: 'HIGH',
                        riskIcon: '▲', color: '#fb8c00',
                        issue: r.duplicate_count + ' duplicate' + (r.duplicate_count > 1 ? 's' : ''),
                        rec: 'Retire duplicates' });
                }
                if (r.missing_fields_count > 0) {
                    fixes.push({ record: r, ciName: r.ci_name, risk: 'MEDIUM',
                        riskIcon: '●', color: '#fdd835',
                        issue: r.missing_fields_count + ' field' + (r.missing_fields_count > 1 ? 's' : '') + ' missing',
                        rec: 'Populate required fields' });
                }
                if (r.violations_count > 0) {
                    fixes.push({ record: r, ciName: r.ci_name, risk: 'CRITICAL',
                        riskIcon: '⚠', color: '#e53935',
                        issue: r.violations_count + ' policy violation' + (r.violations_count > 1 ? 's' : ''),
                        rec: 'Remediate to pass audit' });
                }
            }
        });

        fixes.sort(function(a, b) {
            return (riskOrder[a.risk] || 9) - (riskOrder[b.risk] || 9);
        });

        _quickFixCache    = fixes.slice(0, 24);
        _quickFixCacheKey = key;
        return _quickFixCache;
    };

    $scope.jumpToCi = function(record) {
        $scope.showQuickFixes = false;
        $scope.expandedCard   = record;
        $timeout(function() { $scope.scoresAnimated = true; }, 150);
    };

    // ─── Toast ────────────────────────────────────────────────
    $scope.showToast = function(message, type) {
        $scope.toast = { message: message, type: type || 'success' };
        $timeout(function() { $scope.toast = null; }, 3500);
    };

    // ─── Add CI modal ─────────────────────────────────────────
    $scope.openAddModal = function($event) {
        if ($event) { $event.stopPropagation(); }
        $scope.showAddModal  = true;
        $scope.newCiNames    = '';
        $scope.addMessage    = '';
        $scope.addSuccess    = false;
        $scope.verified      = false;
        $scope.verifyResult  = null;
    };

    $scope.closeAddModal = function() {
        $scope.showAddModal = false;
    };

    $scope.verifyCis = function() {
        if (!$scope.newCiNames) { return; }
        $scope.verifyLoading = true;
        $scope.addMessage    = '';
        $scope.data.action   = 'verify_cis';
        $scope.data.ci_names = $scope.newCiNames;

        $scope.server.update().then(function() {
            $scope.verifyLoading = false;
            var result = $scope.data.verifyResult || { found: [], missing: [], alreadyAdded: [] };
            $scope.verifyResult = result;

            // Verified-OK only if there's at least one fresh CI to add and no missing names
            $scope.verified = (result.found.length > 0 && result.missing.length === 0);

            var parts = [];
            if (result.found.length)        { parts.push(result.found.length + ' ready to add'); }
            if (result.alreadyAdded.length) { parts.push(result.alreadyAdded.length + ' already on watchlist'); }
            if (result.missing.length)      { parts.push('not found: ' + result.missing.join(', ')); }
            $scope.addMessage = parts.join(' · ') || 'No CIs to verify.';
            $scope.addSuccess = $scope.verified;

            $scope.data.action   = '';
            $scope.data.ci_names = '';
        });
    };

    $scope.submitAddCi = function() {
        if (!$scope.verified || !$scope.newCiNames) { return; }
        $scope.addLoading    = true;
        $scope.data.action   = 'add_cis';
        $scope.data.ci_names = $scope.newCiNames;

        $scope.server.update().then(function() {
            $scope.addLoading = false;
            var result = $scope.data.addResult || { success: false, message: 'Unknown error' };
            $scope.addSuccess = result.success;
            $scope.addMessage = result.message;

            if (result.addedCount > 0) {
                $scope.showToast(result.message, 'success');
                $timeout(function() { $scope.closeAddModal(); }, 1500);
            } else {
                $scope.showToast(result.message, 'error');
            }
            $scope.data.action   = '';
            $scope.data.ci_names = '';
        });
    };
};
