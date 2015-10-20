app.service('clientesTable', function (dbFactory) {
    var self = this;
    var table = 'clientes';

    dbFactory.setTable(table);

    return dbFactory;
});

app.controller('clientesController', function ($scope, $stateParams, clientesTable) {
    var self = this;
    $scope.clientes = [];
    $scope.data = {
        nome: 'Teste'
    };

    self.init = function () {
        clientesTable.fetch().then(function (result) {
            $scope.clientes = result;
        });
    }

    return self.init();
});

app.controller('clientesFormularioCadastroController', function ($scope, $stateParams, $location, clientesTable) {
    var self = this;
    $scope.data = {};

    self.init = function () {
        if ($stateParams.id) {
            clientesTable.find($stateParams.id).then(function (result) {
                $scope.data = result;
            });
        }
    }

    $scope.salvarDados = function () {
        clientesTable.save($scope.data).then(function (result) {
            console.log('Registro salvo com sucesso.');
            $location.path('/clientes');
        });
    }

    return self.init();
});