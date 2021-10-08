"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Base = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const builder_1 = __importDefault(require("./builder"));
class Base {
    constructor(db, table, options = {}) {
        this.db = (0, better_sqlite3_1.default)(db, {
            timeout: 10000,
            readonly: false,
        });
        this.table = table;
        this.definition = {};
        this.properties = {};
    }
    attr(name, value) {
        this.properties[name] = value;
    }
    toObject() {
        return {};
    }
    exec(sql) {
        return this.db.exec(sql);
    }
    find(options) {
        const { where = {}, limit, offset, order, fields, group } = options;
        const builder = new builder_1.default({});
        const { sql, params } = builder.table(this.table)
            .where(where)
            .fields(fields)
            .order(order)
            .group(group)
            .limit(limit)
            .offset(offset)
            .select();
        const stmt = this.db.prepare(sql);
        return stmt.all(...params);
    }
    findOne(options = {}) {
        options.limit = 1;
        const res = this.find(options);
        if (res.length) {
            return res[0];
        }
        return null;
    }
    findAll(options = {}) {
        return this.find(options);
    }
    findById(id) {
        return this.findOne({ where: { id } });
    }
    findByIds(ids) {
        return this.findOne({ where: { id: { '$in': ids } } });
    }
    insert(data) {
        const builder = new builder_1.default({});
        const { sql, params } = builder.table(this.table).insert(data);
        return this.db.prepare(sql).run(...params);
    }
    update(where, data) {
        const builder = new builder_1.default({});
        const { sql, params } = builder.table(this.table)
            .where(where)
            .update(data);
        return this.db.prepare(sql).run(...params);
    }
    upsert(data) {
        // @fixme
        if (!data.id) {
            throw new Error('ID not found');
        }
        const record = this.findById(data.id);
        if (record) {
            return this.update({ id: data.id }, data);
        }
        return this.insert(data);
    }
    save() {
    }
    deleteById(id) {
        const record = this.findById(id);
        if (!record) {
            return false;
        }
        const builder = new builder_1.default({});
        const { sql, params } = builder.table(this.table)
            .where({ id })
            .delete();
        return this.db.prepare(sql, params);
    }
    delete(where) {
        const builder = new builder_1.default({});
        const { sql, params } = builder.table(this.table)
            .where(where)
            .delete();
    }
}
exports.Base = Base;
const model = new Base('./test.db', 'users');
// const res = model.exec(`CREATE TABLE users (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   name CHAR(50) NOT NULL,
//   gender CHAR(10) CHECK(gender IN('male', 'female', 'unknown')) NOT NULL,
//   mail CHAR(128) NOT NULL,
//   age INT NOT NULL,
//   createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// );
// `);
// console.log(res);
// model.insert({
//   name: 'tommy',
//   gender: 'male',
//   age: 30,
//   mail: 'tommy@hello.cc',
// });
// model.insert({
//   name: 'jerry',
//   gender: 'female',
//   age: 31,
//   mail: 'jerry@world.cc',
// });
// const records = model.findOne({ where: { id: { '$gte': 1 } } });
// console.log(records);
