"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Builder = void 0;
var parser_1 = require("./parser");
var printj_1 = require("printj");
var Builder = /** @class */ (function () {
    function Builder(options) {
        this.options = options;
        this.parser = new parser_1.Parser();
        this.tableName = '';
        this._fields = [];
        this.values = [];
        this.sql = {};
    }
    Builder.prototype.table = function (table) {
        this.tableName = table;
        return this;
    };
    Builder.prototype.isEmpty = function (data) {
        if (!data) {
            return true;
        }
        if (Array.isArray(data)) {
            return !Boolean(data.length);
        }
        return !Boolean(Object.keys(data).length);
    };
    Builder.prototype.fields = function (fields) {
        if (this.isEmpty(fields)) {
            return this;
        }
        this._fields = fields;
        return this;
    };
    Builder.prototype.where = function (condition) {
        if (this.isEmpty(condition)) {
            return this;
        }
        var _a = this.parser.parse(condition), sql = _a.sql, params = _a.params;
        this.sql.where = { sql: "WHERE " + sql, params: params };
        return this;
    };
    Builder.prototype.order = function (orderBy) {
        var _this = this;
        if (this.isEmpty(orderBy)) {
            return this;
        }
        Object.entries(orderBy).forEach((function (elm) {
            var field = elm[0], sort = elm[1];
            _this.sql.order = { sql: "ORDER BY ? ?", params: [field, sort] };
        }));
        return this;
    };
    Builder.prototype.limit = function (limit) {
        if (!limit) {
            return this;
        }
        this.sql.limit = { sql: "LIMIT ?", params: [limit] };
        return this;
    };
    Builder.prototype.offset = function (offset) {
        if (!offset) {
            return this;
        }
        this.sql.offset = { sql: "OFFSET ?", params: [offset] };
        return this;
    };
    Builder.prototype.group = function (field) {
        if (this.isEmpty(field)) {
            return this;
        }
        this.sql.group = {
            sql: "GROUP BY ?",
            params: [field === null || field === void 0 ? void 0 : field.toString()]
        };
        return this;
    };
    Builder.prototype.select = function (options) {
        if (options === void 0) { options = null; }
        var select = 'SELECT %s FROM `%s` %s';
        var fields = this.isEmpty(this._fields) ? '*' : this._fields.join(',');
        var _a = this.toSql(), sql = _a.sql, params = _a.params;
        var sqlStr = (0, printj_1.sprintf)(select, fields, this.tableName, sql);
        this.free();
        return { sql: sqlStr, params: params };
    };
    Builder.prototype.delete = function () {
        var delSql = 'DELETE FROM `%s` %s';
        var _a = this.toSql(), sql = _a.sql, params = _a.params;
        var sqlStr = (0, printj_1.sprintf)(delSql, this.tableName, sql);
        this.free();
        return { sql: sqlStr, params: params };
    };
    Builder.prototype.update = function (data, options) {
        if (options === void 0) { options = {}; }
        var setSql = [];
        var changed = [];
        Object.entries(data).forEach(function (elm) {
            var field = elm[0], value = elm[1];
            if (value && value.$inc) {
                setSql.push("`" + field + "`=`" + field + "` + " + value.inc);
            }
            else {
                setSql.push(field + "=?");
                changed.push(value === null || value === void 0 ? void 0 : value.toString());
            }
        });
        var _a = this.toSql(), sql = _a.sql, params = _a.params;
        params.map(function (i) { return changed.push(i); });
        var upSql = "UPDATE `%s` SET %s %s";
        var sqlStr = (0, printj_1.sprintf)(upSql, this.tableName, setSql.join(','), sql);
        this.free();
        return { sql: sqlStr, params: changed };
    };
    Builder.prototype.insert = function (data) {
        var fields = [];
        var params = [];
        for (var field in data) {
            fields.push("`" + field + "`");
            params.push(data[field]);
        }
        var fieldStr = fields.join(',');
        var placeholder = fields.map(function (_) { return '?'; }).join(',');
        var sql = 'INSERT INTO `%s` (%s) VALUES (%s)';
        var preSql = (0, printj_1.sprintf)(sql, this.tableName, fieldStr, placeholder);
        return { sql: preSql, params: params };
    };
    Builder.prototype.toSql = function () {
        var _this = this;
        var sqlObj = [];
        var values = [];
        var sequence = ['where', 'group', 'order', 'offset', 'limit'];
        sequence.forEach(function (item) {
            if (!_this.sql[item]) {
                return;
            }
            var _a = _this.sql[item], sql = _a.sql, params = _a.params;
            sqlObj.push(sql);
            if (Array.isArray(params)) {
                params.map(function (v) { return values.push(v); });
            }
            else {
                values.push(params);
            }
        });
        return { sql: sqlObj.join(' '), params: values };
    };
    Builder.prototype.free = function () {
        this._fields = [];
        this.values = [];
        this.sql = {};
    };
    return Builder;
}());
exports.Builder = Builder;
//# sourceMappingURL=builder.js.map