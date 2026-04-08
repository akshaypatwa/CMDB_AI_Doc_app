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
    $scope.scoresAnimated = false;
    $scope.openAccordions = {};
    $scope.toast          = null;

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
            $timeout(function() { $scope.scoresAnimated = true; }, 150);
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
