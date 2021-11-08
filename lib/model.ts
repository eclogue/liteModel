import Sqlite from 'better-sqlite3';
import { Builder } from './builder';
import { Dict, Definition } from './interface';

export class Model {
  db: Sqlite.Database;
  dbFile: string;
  table: string;
  definition: Definition;
  attributes: Dict;
  changed: Dict;
  pk: string;
  constructor(definition: Definition = {}, dbFile?: string, table?: string) {
    this.definition = definition;
    this.attributes = {};
    this.changed = {};
    this.dbFile = dbFile;
    this.table = table;
    this.pk = '';
    this.initialize();
  }

  initialize(): Model {
    if (this.pk) {
      return this;
    }
    for (const key in this.definition) {
      if (this.definition[key].pk) {
        this.pk = key;
        break;
      }
    }
    return this;
  }

  attr(name: string, value: any): void {
    this.attributes[name] = value;
  }

  clone<T extends Model>(instance: T): T {
    return Object.assign(Object.create(Model.prototype), instance);
  }

  instance(data: Dict): Model {
    this.changed = {};
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
          return Reflect.set(target, key, value);
        }
        if (Reflect.has(target.attributes, key)) {
          Reflect.set(target.changed, key, value);
        }
        if (Reflect.has(instance, key)) {
          return instance[key] = value;
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

  find(where: Dict, options: Dict = {}): Model[] {
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
    const res = stmt.all(...params);
    return res.map(item => {
      return this.instance(item);
    })
  }


  findOne(where: Dict, options: Dict = {}): Model | null {
    options.limit = 1;
    const res = this.find(where, options);
    if (res.length) {
      return res[0];
    }
    return null;
  }

  findAll(where: Dict, options: Dict = {}): Model[] {
    return this.find(where, options);
  }

  findById(id: bigint | number): Model | null {
    return this.findOne({ id });
  }

  findByIds(ids: number[]): Model[] {
    const data = this.find({ id: { '$in': ids } });
    if (!data.length) {
      return data;
    }
  }

  insert(data: Dict): Model {
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table).insert(data);
    const { lastInsertRowid } = this.db.prepare(sql).run(...params);
    return this.findById(lastInsertRowid);
  }

  update(where: Dict, data: Dict): any {
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table)
      .where(where)
      .update(data);
    return this.db.prepare(sql).run(...params);
  }

  updateAttributes(data: Dict): Model {
    if (!this.pk) {
      throw new Error('updateAttributes must be called on instance');
    }
    return this.update({ id: this.pk }, data);
  }

  upsert(data: Dict): Model {
    if (!data.id) {
      throw new Error('ID not found');
    }
    const record = this.findById(data.id);
    if (record) {
      return this.update({ id: data.id }, data);
    }
    return this.insert(data);
  }

  save(): Model {
    if (!this.pk || !this.attributes[this.pk]) {
      throw new Error('save must be called on instance');
    }
    this.update({ id: this.attributes[this.pk] }, this.changed);
    return this.findById(this.attributes[this.pk]);
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

