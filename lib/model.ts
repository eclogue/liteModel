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
  db: Sqlite.Database;
  dbFile: string;
  table: string;
  definition: Definition;
  attributes: Dict;
  changed: Dict;
  pk: string;
  constructor(definition: Definition = {}, dbFile?: string, table?: string,) {
    this.definition = definition;
    this.attributes = {};
    this.changed = {};
    this.dbFile = dbFile;
    this.table = table;
  }

  initialize() {
    if (!this.db && this.dbFile) {
      this.db = Database.getInstance(this.dbFile).db;
    }
    if (this.pk) {
      return;
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

  clone<T>(instance: T): T {
    return Object.assign(Object.create(Model.prototype), instance);
  }

  instance(data: Dict) {
    const instance = this.clone(this);
    for (const key in data) {
      instance.attr(key, data[key]);
    }
    const handler = {
      constructor(target, args) {
        return new target(...args);
      },
      get(target: any, key: string) {
        if (Reflect.has(target.changed, key)) {
          return Reflect.get(target.changed, key);
        }
        if (Reflect.has(target.attributes, key)) {
          return Reflect.get(target.attributes, key);
        }
        if (Reflect.has(instance, key)) {
          return instance[key];
        }
        return undefined;
      },
      set(target: any, key: string, value: any): boolean {
        if (value instanceof Function) {
          target[key] = value;
        } else {
          target.changed[key] = value;
        }
        return true;
      }
    };
    const proxy = new Proxy(instance, handler);
    return proxy;
  }

  toObject(): Dict {
    return this.attributes;
  }

  toJSON(): Dict {
    return this.toObject();
  }

  exec(sql: string): any {
    return this.db.exec(sql);
  }

  find(where: Dict, options: Dict = {}): Dict[] {
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


  findOne(where: Dict, options: Dict = {}): Dict | null {
    options.limit = 1;
    const res = this.find(where, options);
    if (res.length) {
      return this.instance(res[0]);
    }
    return null;
  }

  findAll(where: Dict, options: Dict = {}): Dict[] {
    return this.find(where, options);
  }

  findById(id: bigint | number): Dict | null {
    return this.findOne({ id });
  }

  findByIds(ids: number[]): Dict[] {
    const data = this.find({ id: { '$in': ids } });
    if (!data.length) {
      return data;
    }
  }

  insert(data: Dict): Dict {
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table).insert(data);
    const { lastInsertRowid } = this.db.prepare(sql).run(...params);
    return this.findById(lastInsertRowid);
  }

  update(where: Dict, data: Dict): Dict {
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table)
      .where(where)
      .update(data);
    const { lastInsertRowid } = this.db.prepare(sql).run(...params);
    this.changed = {};
    return this.findById(lastInsertRowid);
  }

  updateAttributes(data: Dict): Dict {
    if (!this.pk) {
      throw new Error('updateAttributes must be called on instance');
    }
    return this.update({ id: this.pk }, data);
  }

  upsert(data: Dict): Dict {
    if (!data.id) {
      throw new Error('ID not found');
    }
    const record = this.findById(data.id);
    if (record) {
      return this.update({ id: data.id }, data);
    }
    return this.insert(data);
  }

  save(): Dict {
    if (!this.pk) {
      throw new Error('save must be called on instance');
    }
    return this.update({ id: this.pk }, this.changed);
  }

  deleteById(id: number): boolean {
    const record = this.findById(id);
    if (!record) {
      return false;
    }
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table)
      .where({ id })
      .delete();
    this.db.prepare(sql).run(...params);
    return true;
  }

  delete(where: Dict): Sqlite.RunResult {
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table)
      .where(where)
      .delete();
    return this.db.prepare(sql).run(...params);
  }
}

