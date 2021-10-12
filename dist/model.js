'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.Model = void 0;
const better_sqlite3_1 = __importDefault(require('better-sqlite3'));
const builder_1 = __importDefault(require('./builder'));
class Database {
  constructor(file, options = {}) {
    console.log('dddvvvvv', file);
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
  constructor(definition = {}, dbFile, table) {
    this.definition = definition;
    this.attributes = {};
    this.changed = {};
    this.dbFile = dbFile;
    this.table = table;
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
    const instance = new Model(this.definition);
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
    const { sql, params } = builder
      .table(this.table)
      .where(where)
      .fields(fields)
      .order(order)
      .group(group)
      .limit(limit)
      .offset(offset)
      .select();
    console.log(sql);
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
    const data = this.find({ id: { $in: ids } });
    if (!data.length) {
      return data;
    }
  }
  insert(data) {
    const builder = new builder_1.default({});
    const { sql, params } = builder.table(this.table).insert(data);
    const { lastInsertRowid } = this.db.prepare(sql).run(...params);
    return this.findById(lastInsertRowid);
  }
  update(where, data) {
    const builder = new builder_1.default({});
    const { sql, params } = builder.table(this.table).where(where).update(data);
    const { lastInsertRowid } = this.db.prepare(sql).run(...params);
    return this.findById(lastInsertRowid);
  }
  updateAttributes(data) {
    if (!this.pk) {
      throw new Error('updateAttributes must be called on instance');
    }
    return this.update({ id: this.pk }, data);
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
    const { sql, params } = builder.table(this.table).where({ id }).delete();
    this.db.prepare(sql).run(...params);
    return true;
  }
  delete(where) {
    const builder = new builder_1.default({});
    const { sql, params } = builder.table(this.table).where(where).delete();
    return this.db.prepare(sql).run(...params);
  }
}
exports.Model = Model;
function model(table = '', definition = {}) {
  return function cls(target) {
    return class extends target {
      constructor() {
        super(...arguments);
        this.table = table;
        this.definition = definition;
      }
    };
  };
}
// @model('users1', { a: 1 })
class User extends Model {
  constructor() {
    super();
    this.dbFile = './test.db';
    this.table = 'users';
    this.initialize();
  }
}
const user = new User();
// user.initialize();
// console.log(user.findOne({}));
