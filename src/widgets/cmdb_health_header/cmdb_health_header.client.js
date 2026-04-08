api.controller = function($scope, $timeout) {
    $scope.summary = $scope.data.summary || {
        total: 0, critical: 0, moderate: 0, minor: 0, healthy: 0,
        lastRun: '', hasCritical: false
    };

    $scope.refresh = function() {
        $scope.server.update().then(function() {
            $scope.summary = $scope.data.summary;
        });
    };
};
