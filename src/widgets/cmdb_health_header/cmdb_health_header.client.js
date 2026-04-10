api.controller = function($scope, $timeout, $rootScope) {
    $scope.summary = $scope.data.summary || {
        total: 0, critical: 0, moderate: 0, minor: 0, healthy: 0,
        lastRun: '', hasCritical: false
    };

    // Sync theme with dashboard widget
    try {
        $scope.theme = localStorage.getItem('cmdb_theme') || 'dark';
    } catch (e) {
        $scope.theme = 'dark';
    }

    $scope.$on('cmdb:themeChanged', function(event, theme) {
        $scope.theme = theme;
    });

    $scope.refresh = function() {
        $scope.server.update().then(function() {
            $scope.summary = $scope.data.summary;
        });
    };
};
