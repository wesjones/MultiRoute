function Root($scope, $multiRoute) {
    $scope.name = 'Root';
    $scope.paths = [
        {path:'/a', urlParams:{test:'a'}},
        {path:'/aha', urlParams:{test:'a ha'}},
        {path:'/ahb', urlParams:{test:'a hb'}},
        {path:'/ahc', urlParams:{test:'a hc'}},
        {path:'/ahd', urlParams:{test:'a hd0'}},
        {path:'/ahd', urlParams:{test:'a hd1'}},
        {path:'/ahd', urlParams:{test:'a hd2'}},
        {path:'/ahd', urlParams:{test:'a hd3'}},
        {path:'/ahd', urlParams:{test:'a hd4'}},
        {path:'/groupa'},
        {path:'/groupb'},
        {path:'/groupc'},
        {path:'/groupd'},
        {path:'/a/hd/!/a/ca/ba/!/a/ca/fa'},
        {path:'/a/hd/!/a/ca/bb/!/a/ca/fb'},
        {path:'/a/hd/!/a/ca/bc/!/a/ca/fc'},
        {path:'/a/hd/!/a/ca/bd/!/a/ca/fd'},
        {path:'/a/hd/!/a/cb/ba/!/a/cb/fa'},
        {path:'/a/hd/!/a/cb/bb/!/a/cb/fb'},
        {path:'/a/hd/!/a/cb/bc/!/a/cb/fc'},
        {path:'/a/hd/!/a/cb/bd/!/a/cb/fd'},
        {path:'/a/hd/!/a/cc/ba/!/a/cc/fa'},
        {path:'/a/hd/!/a/cc/bb/!/a/cc/fb'},
        {path:'/a/hd/!/a/cc/bc/!/a/cc/fc'},
        {path:'/a/hd/!/a/cc/bd/!/a/cc/fd'},
        {path:'/a/hd/!/a/cd/ba/!/a/cd/fa'},
        {path:'/a/hd/!/a/cd/bb/!/a/cd/fb'},
        {path:'/a/hd/!/a/cd/bc/!/a/cd/fc'},
        {path:'/a/hd/!/a/cd/bd/!/a/cd/fd'},
        {path:'/b/ha'},
        {path:'/b/hb'},
        {path:'/b/hc'},
        {path:'/b/hd'},
        {path:'/b/ha/!/b/ba/!/b/fa'},
        {path:'/b/hb/!/b/bb/!/b/fa'},
        {path:'/b/hc/!/b/bc/!/b/fa'},
        {path:'/b/hd/!/b/bd/!/b/fa'},
        {path:'/b/hb/!/b/bd/!/b/fb'},
        {path:'/b/hc/!/b/bd/!/b/fc'},
        {path:'/b/hd/!/b/bd/!/b/fd'},
        {path:'/b/hd/!/b/bd/!/b/fc'},
        {path:'/b/hd/!/b/bd/!/b/fb'},
        {path:'/b/hd/!/b/bd/!/b/fa'},
        {path:'/b/hd/!/b/bc/!/b/fa'},
        {path:'/b/hd/!/b/bb/!/b/fa'},
        {path:'/b/hd/!/b/ba/!/b/fa'},
        {path:'/b/hc/!/b/ba/!/b/fa'},
        {path:'/b/hb/!/b/ba/!/b/fa'},
        {path:'/b/ha/!/b/ba/!/b/fa'},
        {path:'/c'},
        {path:'/d'}
    ];
    $scope.go = function(pathItem) {
        $multiRoute.setPath(pathItem.path, pathItem.urlParams);
    };
    $scope.start = function() {
        var i,
            iLen = $scope.paths.length;
        $scope.paths.forEach($scope.go);
        for(i = 0; i < iLen; i+=1) {
            $multiRoute.go(-1);
        }
        for(i = 0; i < iLen; i+=1) {
            $multiRoute.go(1);
        }
    };
    $scope.getPathClass = function(pathItem) {
        var isCurrent = $multiRoute.getPath() === pathItem.path;
        return isCurrent ? 'selected' : '';
    }
}
Root.$inject = ['$scope', '$multiRoute'];

function CtrlLayoutA($scope) { $scope.name = 'CtrlLayoutA'; } CtrlLayoutA.$inject = ['$scope'];
function CtrlLayoutB($scope) { $scope.name = 'CtrlLayoutB'; } CtrlLayoutB.$inject = ['$scope'];
function CtrlLayoutC($scope) { $scope.name = 'CtrlLayoutC'; } CtrlLayoutC.$inject = ['$scope'];
function CtrlLayoutD($scope) { $scope.name = 'CtrlLayoutD'; } CtrlLayoutD.$inject = ['$scope'];

function CtrlHeaderA($scope) { $scope.name = 'CtrlHeaderA'; } CtrlHeaderA.$inject = ['$scope'];
function CtrlHeaderB($scope) { $scope.name = 'CtrlHeaderB'; } CtrlHeaderB.$inject = ['$scope'];
function CtrlHeaderC($scope) { $scope.name = 'CtrlHeaderC'; } CtrlHeaderC.$inject = ['$scope'];
function CtrlHeaderD($scope) { $scope.name = 'CtrlHeaderD'; } CtrlHeaderD.$inject = ['$scope'];

function CtrlContentA($scope) { $scope.name = 'CtrlContentA'; } CtrlContentA.$inject = ['$scope'];
function CtrlContentB($scope) { $scope.name = 'CtrlContentB'; } CtrlContentB.$inject = ['$scope'];
function CtrlContentC($scope) { $scope.name = 'CtrlContentC'; } CtrlContentC.$inject = ['$scope'];
function CtrlContentD($scope) { $scope.name = 'CtrlContentD'; } CtrlContentD.$inject = ['$scope'];

function CtrlBodyA($scope) { $scope.name = 'CtrlBodyA'; } CtrlBodyA.$inject = ['$scope'];
function CtrlBodyB($scope) { $scope.name = 'CtrlBodyB'; } CtrlBodyB.$inject = ['$scope'];
function CtrlBodyC($scope) { $scope.name = 'CtrlBodyC'; } CtrlBodyC.$inject = ['$scope'];
function CtrlBodyD($scope) { $scope.name = 'CtrlBodyD'; } CtrlBodyD.$inject = ['$scope'];

function CtrlFootA($scope) { $scope.name = 'CtrlFootA'; } CtrlFootA.$inject = ['$scope'];
function CtrlFootB($scope) { $scope.name = 'CtrlFootB'; } CtrlFootB.$inject = ['$scope'];
function CtrlFootC($scope) { $scope.name = 'CtrlFootC'; } CtrlFootC.$inject = ['$scope'];
function CtrlFootD($scope) { $scope.name = 'CtrlFootD'; } CtrlFootD.$inject = ['$scope'];

