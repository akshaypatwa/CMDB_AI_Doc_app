# Client Scripts (AngularJS)

All client scripts use `$scope` — never `c`. Controller signature:

```javascript
api.controller = function($scope, spUtil, $timeout, $http) { ... }
```

---

## Widget 1: Header (`cmdb_health_header`)

```javascript
api.controller = function($scope, $timeout) {
    $scope.summary = $scope.data.summary || { total: 0, critical: 0, moderate: 0, minor: 0, healthy: 0, lastRun: '', hasCritical: false };

    $scope.refresh = function() {
        $scope.server.update().then(function() {
            $scope.summary = $scope.data.summary;
        });
    };
};
```

---

## Widget 2: Dashboard (`cmdb_health_dashboard`)

### Initialization and Environment Dropdown

```javascript
api.controller = function($scope, spUtil, $timeout, $http) {
    // Initialise from server data
    $scope.allRecords   = $scope.data.records || [];
    $scope.summary      = $scope.data.summary || {};
    $scope.environments = ['All'];
    $scope.selectedEnv  = 'All';
    $scope.activeFilter = 'all';
    $scope.searchQuery  = '';
    $scope.sortBy       = 'score_asc';
    $scope.expandedCard = null;
    $scope.scoresAnimated = false;

    // Build environment list dynamically from loaded records
    var envMap = {};
    angular.forEach($scope.allRecords, function(r) {
        if (r.environment && !envMap[r.environment]) {
            envMap[r.environment] = true;
            $scope.environments.push(r.environment);
        }
    });

    // Kick off score bar animation after render
    $timeout(function() { $scope.scoresAnimated = true; }, 200);
};
```

---

## Score Bar Animation

```javascript
$scope.animateScores = function() {
    $timeout(function() {
        $scope.scoresAnimated = true;
    }, 100);
};
// In HTML: ng-style="{'width': scoresAnimated ? record.overall_score + '%' : '0%'}"
```

## Status Colour Helpers

```javascript
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
    var labels = {
        'critical': 'CRITICAL',
        'moderate': 'MODERATE',
        'minor':    'MINOR',
        'healthy':  'HEALTHY'
    };
    return labels[status] || status.toUpperCase();
};
```

## Card Expand/Collapse

```javascript
$scope.expandedCard = null;

$scope.toggleCard = function(record) {
    if ($scope.expandedCard && $scope.expandedCard.sys_id === record.sys_id) {
        $scope.expandedCard = null;
    } else {
        $scope.expandedCard = record;
        $timeout(function() {
            $scope.scoresAnimated = true;
        }, 150);
    }
};

$scope.isExpanded = function(record) {
    return $scope.expandedCard && $scope.expandedCard.sys_id === record.sys_id;
};
```

## Filter, Search, and Sort

```javascript
$scope.setFilter = function(status) {
    $scope.activeFilter = status;
};

$scope.setEnv = function(env) {
    $scope.selectedEnv = env;
};

$scope.getFilteredRecords = function() {
    var records = $scope.allRecords || [];

    var filtered = records.filter(function(r) {
        var matchesStatus = ($scope.activeFilter === 'all') || (r.health_status === $scope.activeFilter);
        var matchesEnv    = ($scope.selectedEnv === 'All')  || (r.environment === $scope.selectedEnv);
        var matchesSearch = !$scope.searchQuery ||
            r.ci_name.toLowerCase().indexOf($scope.searchQuery.toLowerCase()) !== -1;
        return matchesStatus && matchesEnv && matchesSearch;
    });

    // Sort
    filtered.sort(function(a, b) {
        if ($scope.sortBy === 'score_asc')  { return a.overall_score - b.overall_score; }
        if ($scope.sortBy === 'score_desc') { return b.overall_score - a.overall_score; }
        if ($scope.sortBy === 'name')       { return a.ci_name.localeCompare(b.ci_name); }
        if ($scope.sortBy === 'date')       { return (b.analysis_date || '').localeCompare(a.analysis_date || ''); }
        return 0;
    });

    return filtered;
};
```

## Accordion Toggle

```javascript
$scope.openAccordions = {};

$scope.toggleAccordion = function(key) {
    $scope.openAccordions[key] = !$scope.openAccordions[key];
};

$scope.isAccordionOpen = function(key) {
    return !!$scope.openAccordions[key];
};
```

## Toast Notification

```javascript
$scope.toast = null;

$scope.showToast = function(message, type) {
    $scope.toast = { message: message, type: type || 'success' };
    $timeout(function() { $scope.toast = null; }, 3500);
};
```

## Score Delta Display

```javascript
$scope.getDeltaIcon = function(delta) {
    if (!delta && delta !== 0) { return ''; }
    var d = parseInt(delta, 10);
    if (d > 0)  { return '↑'; }
    if (d < 0)  { return '↓'; }
    return '→';
};

$scope.getDeltaColor = function(delta) {
    if (!delta && delta !== 0) { return '#546e7a'; }
    var d = parseInt(delta, 10);
    if (d > 0)  { return '#43a047'; }
    if (d < 0)  { return '#e53935'; }
    return '#546e7a';
};
```

## Add CI Modal

```javascript
$scope.showAddModal = false;
$scope.newCiName    = '';
$scope.addMessage   = '';
$scope.addSuccess   = false;
$scope.addLoading   = false;

$scope.openAddModal = function() {
    $scope.showAddModal = true;
    $scope.newCiName    = '';
    $scope.addMessage   = '';
    $scope.addSuccess   = false;
};

$scope.closeAddModal = function() {
    $scope.showAddModal = false;
};

$scope.submitAddCi = function() {
    if (!$scope.newCiName) { return; }
    $scope.addLoading = true;
    $scope.data.action  = 'add_ci';
    $scope.data.ci_name = $scope.newCiName;

    $scope.server.update().then(function() {
        $scope.addLoading = false;
        $scope.addSuccess = $scope.data.addResult.success;
        $scope.addMessage = $scope.data.addResult.message;
        if ($scope.addSuccess) {
            $timeout(function() {
                $scope.closeAddModal();
            }, 2000);
        }
    });
};
```
