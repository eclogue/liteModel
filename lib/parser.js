"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
var printj_1 = require("printj");
var OPERATOR = {
    '$eq': '=',
    '$neq': '!=',
    '$gt': '>',
    '$lt': '<',
    '$gte': '>=',
    '$lte': '<=',
    '$like': 'LIKE',
    '$isNull': 'IS NULL',
    '$isNotNull': 'IS NOT NULL',
    '$inc': true,
};
var LOGICAL = {
    $and: 'AND',
    $or: 'OR',
    $xor: 'XOR'
};
var Parser = /** @class */ (function () {
    function Parser() {
        this.tree = [];
    }
    Parser.prototype.genNode = function (entities, isChild) {
        var _this = this;
        if (isChild === void 0) { isChild = false; }
        Object.entries(entities).forEach(function (item) {
            var key = item[0];
            var v = item[1];
            var value = v && typeof v === 'object' ? v : { $eq: v };
            if (!(key in LOGICAL)) {
                if (Array.isArray(value)) {
                    value.forEach(function (i) {
                        _this.genNode(i, true);
                    });
                }
                else {
                    Object.keys(value).map(function (op) {
                        var _a;
                        var node = {
                            type: 'field',
                            name: key,
                            value: (_a = {}, _a[op] = value[op], _a),
                            isChild: true,
                            connector: ' AND '
                        };
                        _this.tree.push(node);
                    });
                }
            }
            else {
                var node = {
                    type: 'logical',
                    name: LOGICAL[key],
                    value: value,
                    isChild: isChild,
                };
                _this.tree.push(node);
                _this.genNode(value, true);
            }
        });
    };
    Parser.prototype.getDefaultNode = function (isChild) {
        return {
            type: 'operator',
            name: 'and',
            value: isChild ? 0 : 1,
            isChild: isChild,
        };
    };
    Parser.prototype.parse = function (entities) {
        var _this = this;
        this.genNode(entities);
        var sql = [];
        var prev;
        var level = 0;
        var params = [];
        this.tree.forEach(function (node) {
            if (node.type === 'field') {
                if (prev && prev.type !== 'field') {
                    sql.push(')');
                }
                var res = _this.parseFieldNode(node);
                sql.push(res.sql);
                res.values.map(function (v) { return params.push(v); });
            }
            else {
                sql.push(_this.parseLogicalNode(node));
                if (!node.isChild) {
                    sql.push('(');
                    level += 1;
                }
                else if (level) {
                    sql.push(')');
                    level -= 1;
                }
            }
            prev = node;
        });
        if (level) {
            sql.push(')');
        }
        this.free();
        return { sql: sql.join('').replace(/(.*)and/i, '$1'), params: params };
    };
    Parser.prototype.parseFieldNode = function (node) {
        var _this = this;
        var _a;
        var fieldStr = '';
        var field = '`' + node.name + '`';
        var connector = (_a = node.connector) === null || _a === void 0 ? void 0 : _a.toUpperCase().substr(1);
        var values = [];
        Object.entries(node.value).forEach(function (element) {
            var _a;
            var operator = element[0];
            var value = element[1];
            var name = "$" + node.name;
            var temp = [field];
            if (operator === '$inc') {
                temp.push(_this.increment(node.name, value));
            }
            else if (OPERATOR[operator]) {
                temp.push(OPERATOR[operator]);
                temp.push('?');
                values.push(value);
            }
            else {
                var func = _this.sqlFunction(operator);
                temp.push((0, printj_1.sprintf)(func, name));
                values.push((_a = {}, _a[name] = value === null || value === void 0 ? void 0 : value.toString(), _a));
            }
            temp.push(connector);
            fieldStr += temp.join(' ');
        });
        return { sql: fieldStr, values: values };
    };
    Parser.prototype.parseLogicalNode = function (node) {
        return " " + node.name + " ";
    };
    Parser.prototype.increment = function (field, value) {
        if (isNaN(value)) {
            throw new Error('mews increment value must be number');
        }
        return '=`' + field + '` + ' + value;
    };
    Parser.prototype.sqlFunction = function (name) {
        return name.toUpperCase().replace('$', '') + ' (%s) ';
    };
    Parser.prototype.free = function () {
        this.tree = [];
    };
    return Parser;
}());
exports.Parser = Parser;
//# sourceMappingURL=parser.js.map