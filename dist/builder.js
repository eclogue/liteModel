"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parser_1 = __importDefault(require("./parser"));
const printj_1 = require("printj");
class Builder {
    constructor(options) {
        this.options = options;
        this.parser = new parser_1.default();
        this.tableName = '';
        this._fields = [];
        this.values = [];
        this.sql = {};
    }
    table(table) {
        this.tableName = table;
        return this;
    }
    isEmpty(data) {
        if (!data) {
            return true;
        }
        if (Array.isArray(data)) {
            return !Boolean(data.length);
        }
        return !Boolean(Object.keys(data).length);
    }
    fields(fields) {
        if (this.isEmpty(fields)) {
            return this;
        }
        this._fields = fields;
        return this;
    }
    where(condition) {
        if (this.isEmpty(condition)) {
            return this;
        }
        const { sql, params } = this.parser.parse(condition);
        this.sql.where = { sql: `WHERE ${sql}`, params };
        return this;
    }
    order(orderBy) {
        if (this.isEmpty(orderBy)) {
            return this;
        }
        Object.entries(orderBy).forEach((elm => {
            const [field, sort] = elm;
            this.sql.order = { sql: `ORDER BY ? ?`, params: [field, sort] };
        }));
        return this;
    }
    limit(limit) {
        if (!limit) {
            return this;
        }
        this.sql.limit = { sql: `LIMIT ?`, params: [limit] };
        return this;
    }
    offset(offset) {
        if (!offset) {
            return this;
        }
        this.sql.offset = { sql: `OFFSET ?`, params: [offset] };
        return this;
    }
    group(field) {
        if (this.isEmpty(field)) {
            return this;
        }
        this.sql.group = {
            sql: `GROUP BY ?`,
            params: [field === null || field === void 0 ? void 0 : field.toString()]
        };
        return this;
    }
    select(options = null) {
        const select = 'SELECT %s FROM `%s` %s';
        const fields = this.isEmpty(this._fields) ? '*' : this._fields.join(',');
        const { sql, params } = this.toSql();
        const sqlStr = (0, printj_1.sprintf)(select, fields, this.tableName, sql);
        this.free();
        return { sql: sqlStr, params };
    }
    delete() {
        const delSql = 'DELETE FROM `%s` %s';
        const { sql, params } = this.toSql();
        const sqlStr = (0, printj_1.sprintf)(delSql, this.tableName, sql);
        this.free();
        return { sql: sqlStr, params };
    }
    update(data, options = {}) {
        const setSql = [];
        const changed = [];
        Object.entries(data).forEach(elm => {
            const [field, value] = elm;
            if (value && value.$inc) {
                setSql.push(`\`${field}\`=\`${field}\` + ${value.inc}`);
            }
            else {
                setSql.push(`${field}=?`);
                changed.push(value === null || value === void 0 ? void 0 : value.toString());
            }
        });
        const { sql, params } = this.toSql();
        params.map(i => changed.push(i));
        const upSql = `UPDATE \`%s\` SET %s %s`;
        const sqlStr = (0, printj_1.sprintf)(upSql, this.tableName, setSql.join(','), sql);
        this.free();
        return { sql: sqlStr, params };
    }
    insert(data) {
        const fields = [];
        const params = [];
        for (const field in data) {
            fields.push(`\`${field}\``);
            params.push(data[field]);
        }
        const fieldStr = fields.join(',');
        const placeholder = fields.map(_ => '?').join(',');
        const sql = 'INSERT INTO `%s` (%s) VALUES (%s)';
        const preSql = (0, printj_1.sprintf)(sql, this.tableName, fieldStr, placeholder);
        return { sql: preSql, params };
    }
    toSql() {
        const sqlObj = [];
        const values = [];
        const sequence = ['where', 'group', 'order', 'offset', 'limit'];
        sequence.forEach(item => {
            if (!this.sql[item]) {
                return;
            }
            const { sql, params } = this.sql[item];
            sqlObj.push(sql);
            if (Array.isArray(params)) {
                params.map(v => values.push(v));
            }
            else {
                values.push(params);
            }
        });
        return { sql: sqlObj.join(' '), params: values };
    }
    free() {
        this._fields = [];
        this.values = [];
        this.sql = {};
    }
    ;
}
exports.default = Builder;
