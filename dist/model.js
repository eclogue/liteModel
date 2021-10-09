"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Model = void 0;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const builder_1 = __importDefault(require("./builder"));
class Database {
    constructor(file, options = {}) {
        this.db = (0, better_sqlite3_1.default)(file, options);
    }
    static getInstance(file, options = {}) {
        if (Database.instance) {
            return Database.instance;
        }
        return new Database(file, options);
    }
}
class Model {
    constructor(db, table, definition = {}) {
        this.dbFile = '';
        this.dbFile = db;
        this.table = table;
        this.definition = definition;
        this.attributes = {};
        this.changed = {};
        this.initialize();
    }
    initialize() {
        if (!this.db) {
            this.db = Database.getInstance(this.dbFile).db;
        }
        for (const key in this.definition) {
            if (this.definition[key].pk) {
                this.pk = key;
                break;
            }
        }
    }
    attr(name, value) {
        if (name === this.pk) {
            this.pk = value;
        }
        this.attributes[name] = value;
    }
    instance(data) {
        const instance = new Model(this.dbFile, this.table, this.definition);
        for (const key in data) {
            instance.attr(key, data[key]);
        }
        const handler = {
            get(target, key) {
                if (Reflect.has(target.changed, key)) {
                    return Reflect.get(target.changed, key);
                }
                if (Reflect.has(target.attributes, key)) {
                    return Reflect.get(target.attributes, key);
                }
                if (typeof this[key] === 'function') {
                    return this[key];
                }
                return null;
            },
            set(target, key, value) {
                target.changed[key] = value;
                return true;
            }
        };
        const proxy = new Proxy(instance, handler);
        return proxy;
    }
    toObject() {
        return this.attributes;
    }
    toJSON() {
        return this.toJSON();
    }
    exec(sql) {
        return this.db.exec(sql);
    }
    find(where, options = {}) {
        const { limit, offset, order, fields, group } = options;
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
    findOne(where, options = {}) {
        options.limit = 1;
        const res = this.find(where, options);
        if (res.length) {
            return this.instance(res[0]);
        }
        return null;
    }
    findAll(where, options = {}) {
        return this.find(where, options);
    }
    findById(id) {
        return this.findOne({ id });
    }
    findByIds(ids) {
        const data = this.find({ id: { '$in': ids } });
        if (!data.length) {
            return data;
        }
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
        if (!this.pk) {
            throw new Error('save must be called on instance');
        }
        return this.update({ id: this.pk }, this.changed);
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
        return this.db.prepare(sql).run(...params);
    }
    delete(where) {
        const builder = new builder_1.default({});
        const { sql, params } = builder.table(this.table)
            .where(where)
            .delete();
        return this.db.prepare(sql).run(...params);
    }
}
exports.Model = Model;
