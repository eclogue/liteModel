"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const printj_1 = require("printj");
const OPERATOR = {
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
const LOGICAL = {
    $and: 'AND',
    $or: 'OR',
    $xor: 'XOR'
};
class Parser {
    constructor() {
        this.tree = [];
    }
    genNode(entities, isChild = false) {
        Object.entries(entities).forEach((item) => {
            const key = item[0];
            const v = item[1];
            const value = v && typeof v === 'object' ? v : { $eq: v };
            if (!(key in LOGICAL)) {
                if (Array.isArray(value)) {
                    value.forEach(i => {
                        this.genNode(i, true);
                    });
                }
                else {
                    Object.keys(value).map(op => {
                        const node = {
                            type: 'field',
                            name: key,
                            value: { [op]: value[op] },
                            isChild: true,
                            connector: ' AND '
                        };
                        this.tree.push(node);
                    });
                }
            }
            else {
                const node = {
                    type: 'logical',
                    name: LOGICAL[key],
                    value,
                    isChild,
                };
                this.tree.push(node);
                this.genNode(value, true);
            }
        });
    }
    getDefaultNode(isChild) {
        return {
            type: 'operator',
            name: 'and',
            value: isChild ? 0 : 1,
            isChild,
        };
    }
    parse(entities) {
        this.genNode(entities);
        const sql = [];
        let prev;
        let level = 0;
        const params = [];
        this.tree.forEach((node) => {
            if (node.type === 'field') {
                if (prev && prev.type !== 'field') {
                    sql.push(')');
                }
                const res = this.parseFieldNode(node);
                sql.push(res.sql);
                res.values.map((v) => params.push(v));
            }
            else {
                sql.push(this.parseLogicalNode(node));
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
        return { sql: sql.join('').replace(/(.*)and/i, '$1'), params };
    }
    parseFieldNode(node) {
        var _a;
        let fieldStr = '';
        const field = '`' + node.name + '`';
        const connector = (_a = node.connector) === null || _a === void 0 ? void 0 : _a.toUpperCase().substr(1);
        const values = [];
        Object.entries(node.value).forEach(element => {
            const operator = element[0];
            const value = element[1];
            const name = `$${node.name}`;
            const temp = [field];
            if (operator === '$inc') {
                temp.push(this.increment(node.name, value));
            }
            else if (OPERATOR[operator]) {
                temp.push(OPERATOR[operator]);
                temp.push('?');
                values.push(value);
            }
            else {
                const func = this.sqlFunction(operator);
                temp.push((0, printj_1.sprintf)(func, name));
                values.push({ [name]: value === null || value === void 0 ? void 0 : value.toString() });
            }
            temp.push(connector);
            fieldStr += temp.join(' ');
        });
        return { sql: fieldStr, values };
    }
    parseLogicalNode(node) {
        return ` ${node.name} `;
    }
    increment(field, value) {
        if (isNaN(value)) {
            throw new Error('mews increment value must be number');
        }
        return '=`' + field + '` + ' + value;
    }
    sqlFunction(name) {
        return name.toUpperCase().replace('$', '') + ' (%s) ';
    }
    free() {
        this.tree = [];
    }
}
exports.default = Parser;
// let p = new Parser();
// let r = p.parse({ a: 1, b: { $gt: 7, $lt: 9 }, c: { $in: [3, 4, 5] } });
// console.log('%j', r);
