var dbFactory = angular.module('smartServices.dbFactory', []);

//1 Plastcril Neve
//1 Plastcril Marfim
//1 Bemalar Marfim
//2 Textura Malaga



dbFactory.constant('DB_CONFIG', {
    name: 'smartDB',
    version: '1.0',
    description: 'smartOffice dataBase',
    size: 200000,
    tables: [
        {
            name: 'clientes',
            columns: [
                {name: 'id', type: 'integer primary key'},
                {name: 'nome', type: 'TEXT NOT NULL'},
                {name: 'documento', type: 'TEXT'},
                {name: 'telefone', type: 'TEXT'},
                {name: 'email', type: 'TEXT'},
                {name: 'endereco', type: 'TEXT'},
                {name: 'bairro', type: 'TEXT'},
                {name: 'cidade', type: 'TEXT'},
                {name: 'estado', type: 'TEXT'},
                {name: 'cep', type: 'TEXT'},
                {name: 'observacao', type: 'TEXT'},
                {name: 'editado', type: 'INTEGER'},
                {name: 'excluido', type: 'INTEGER'}
            ]
        }
    ]
});

dbFactory.factory('dbFactory', function ($q, DB_CONFIG) {
    var self = this;
    self.db = null;
    self.table = '';

    self.init = function () {
        // Use self.db = window.sqlitePlugin.openDatabase({name: DB_CONFIG.name}); in production
        //self.db = window.openDatabase(DB_CONFIG.name, '1.0', 'database', -1);
        self.db = window.openDatabase(DB_CONFIG.name, DB_CONFIG.version, DB_CONFIG.description, DB_CONFIG.size);

        angular.forEach(DB_CONFIG.tables, function (table) {
            var columns = [];

            angular.forEach(table.columns, function (column) {
                columns.push(column.name + ' ' + column.type);
            });

            var query = 'CREATE TABLE IF NOT EXISTS ' + table.name + ' (' + columns.join(',') + ')';
            self.query(query);
            //console.log('Table ' + table.name + ' initialized');
        });
    };

    self.setTable = function (table) {
        self.table = table;
        return self;
    };

    self.query = function (query, bindings) {
        bindings = typeof bindings !== 'undefined' ? bindings : [];
        var deferred = $q.defer();

        self.db.transaction(function (transaction) {
            transaction.executeSql(query, bindings, function (transaction, result) {
                deferred.resolve(result);
            }, function (transaction, error) {
                deferred.reject(error);
            });
        });

        return deferred.promise;
    };

    self.fetch = function (params) {
        params = typeof params === 'undefined' ? {} : params;
        var sql = '';
        if (typeof params == 'string') {
            sql = params;
        } else {
            sql = 'SELECT ';
            if (typeof params.columns == 'string') {
                sql = sql + params.cloumns;
            } else if (typeof params.columns == 'array') {
                sql = sql + params.columns.toString();
            } else {
                sql = sql + '*';
            }

            if (sql.length == 0) {
                throw 'SQL montada de forma errada dendo do getRegisters';
            }

            sql = sql + ' FROM ' + self.table;
            if (typeof params.where == 'string') {
                sql = sql + ' WHERE ' + params.where + " AND excluido = 0";
            } else if (typeof params.where == 'array') {
                sql = sql + ' WHERE ';
                angular.forEach(params.where, function (index, val) {
                    sql = sql + val + ' AND ';
                });
                sql = sql + 'excluido = 0';
            } else {
                sql = sql + ' WHERE excluido = 0';
            }

            if (typeof params.order == 'string') {
                sql = sql + ' ORDER BY ' + params.order;
            }
        }
        return self.query(sql, []).then(function (result) {
            var output = [];
            for (var i = 0; i < result.rows.length; i++) {
                output.push(result.rows.item(i));
            }

            return output;
        });

    };

    self.find = function (id) {
        var sql = "SELECT * FROM " + self.table + " WHERE id = ?";
        return self.query(sql, [id]).then(function (result) {
            return result.rows.item(0);
        });
    };

    self.save = function (data) {
        data.editado = 1;
        data.excluido = 0;
        var columns = [];
        var values = [];
        var valuesBindings = [];
        var insert = true;
        var sql, id;
        angular.forEach(data, function (ve, ix) {
            if (ix == 'id') {
                if (ve != '') {
                    insert = false;
                    id = ve;
                }
            } else {
                columns.push(ix);
                values.push(ve);
                valuesBindings.push('?');
            }
        });

        if (insert) {
            sql = "INSERT INTO " + self.table + " (" + columns.join(',') + ") VALUES (" + valuesBindings.toString() + ")";
            return self.query(sql, values).then(function (result) {
                return result.insertId;
            }, function (error) {
                console.log(error);
            });
        } else {
            sql = "UPDATE " + self.table + " SET " + columns.join(' = ?,') + " = ? WHERE id = " + id;
            return self.query(sql, values).then(function (result) {
                return id;
            }, function (error) {
                console.log(error);
            });
        }
    };

    return self;
});