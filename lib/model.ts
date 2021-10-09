import Sqlite from 'better-sqlite3';
import Builder from './builder';
import { Dict, Definition } from './interface';

class Database {
  readonly db: Sqlite.Database | null;
  private static instance: Database;
  private constructor(file: string, options: Dict = {}) {
    this.db = Sqlite(file, options)
  }

  static getInstance(file: string, options: Dict = {}) {
    if (Database.instance) {
      return Database.instance;
    }
    return new Database(file, options);
  }
}

export class Model {
  db: any;
  readonly dbFile: string = '';
  table: string;
  definition: Definition;
  attributes: Dict;
  changed: Dict;
  pk: string;
  constructor(db: string, table: string, definition: Definition = {}) {
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

  attr(name: string, value: any) {
    if (name === this.pk) {
      this.pk = value;
    }
    this.attributes[name] = value;
  }

  instance(data: Dict) {
    const instance = new Model(this.dbFile, this.table, this.definition);
    for (const key in data) {
      instance.attr(key, data[key]);
    }
    const handler = {
      get(target: any, key: string) {
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
      set(target: any, key: string, value: any): boolean {
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

  exec(sql: string) {
    return this.db.exec(sql);
  }

  find(where: Dict, options: Dict = {}) {
    const { limit, offset, order, fields, group } = options;
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table)
      .where(where)
      .fields(fields)
      .order(order)
      .group(group)
      .limit(limit)
      .offset(offset)
      .select();
    const stmt = this.db.prepare(sql);
    return stmt.all(...params)
  }


  findOne(where: Dict, options: Dict = {}) {
    options.limit = 1;
    const res = this.find(where, options);
    if (res.length) {
      return this.instance(res[0]);
    }
    return null;
  }

  findAll(where: Dict, options: Dict = {}) {
    return this.find(where, options);
  }

  findById(id: string | number) {
    return this.findOne({ id });
  }

  findByIds(ids: any[]) {
    const data = this.find({ id: { '$in': ids } });
    if (!data.length) {
      return data;
    }
  }

  insert(data: Dict) {
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table).insert(data);
    return this.db.prepare(sql).run(...params);
  }

  update(where: Dict, data: Dict) {
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table)
      .where(where)
      .update(data);
    return this.db.prepare(sql).run(...params);
  }

  upsert(data: Dict) {
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

  deleteById(id: string | number) {
    const record = this.findById(id);
    if (!record) {
      return false;
    }
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table)
      .where({ id })
      .delete();
    return this.db.prepare(sql).run(...params);
  }

  delete(where: Dict) {
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table)
      .where(where)
      .delete();
    return this.db.prepare(sql).run(...params);
  }
}
