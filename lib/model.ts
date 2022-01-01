import Sqlite from 'better-sqlite3';
import { Builder } from './builder';
import { Dict, Schema, ModelOpts } from './interface';
import DB from './db';
import { isEmpty, pick, has, equals } from 'ramda';

export class Model {
  private _db: DB;
  protected _table: string;
  protected _schema: Schema = {};
  protected _dbFile: string;
  private _attributes: Dict;
  private _changed: Dict;
  private _pk: string[];
  constructor(options: ModelOpts) {
    this._attributes = {};
    this._changed = {};
    this._pk = [];
    this.initialize(options);
  }

  get db(): Sqlite.Database {
    return this._db.db;
  }

  initialize(config: ModelOpts): void {
    if (this._db) {
      return;
    }
    if (config.dbFile) {
      this._dbFile = config.dbFile;
    }
    if (config.schema) {
      this._schema = config.schema;
    }
    if (config.table) {
      this._table = config.table;
    }
    this._db = DB.getInstance(this._dbFile, config.dbOptions);
    for (const key in this._schema) {
      if (this._schema[key].pk) {
        this._pk.push(key);
      }
    }
    return;
  }

  attr(name: string, value: any): void {
    this._attributes[name] = value;
  }

  clone<T extends Model>(instance: T): T {
    return Object.assign(Object.create(Model.prototype), instance);
  }

  instance(data: Dict): Model {
    this._changed = {};
    this._attributes = {};
    const instance = this.clone(this);
    for (const key in data) {
      instance.attr(key, data[key]);
    }
    const handler = {
      constructor(target, args) {
        return new target(...args);
      },
      get(target: any, key: string) {
        if (Reflect.has(target._changed, key)) {
          return Reflect.get(target._changed, key);
        }
        if (Reflect.has(target._attributes, key)) {
          return Reflect.get(target._attributes, key);
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
        if (Reflect.has(target._attributes, key) && !equals(Reflect.get(target._attributes, key), value)) {
          Reflect.set(target._changed, key, value);
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
    return this._attributes;
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
    const { sql, params } = builder.table(this._table)
      .where(where)
      .fields(fields)
      .order(order)
      .group(group)
      .limit(limit)
      .offset(offset)
      .select();
    const stmt = this.db.prepare(sql);
    const res = stmt.all(...params);
    if (options.rows) {
      return res;
    }
    return res.map(item => {
      return this.instance(item);
    })
  }

  count(where: Dict): number {
    const res = this.findOne(where, { fields: ['count(*) as count'] });
    return Number(res.count);
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
    return this.find({ id: { '$in': ids } });
  }
  create(data: Dict): Model {
    return this.insert(data);
  }

  insert(data: Dict): Model {
    const builder = new Builder({});
    const { sql, params } = builder.table(this._table).insert(data);
    const { lastInsertRowid } = this.db.prepare(sql).run(...params);
    return this.findById(lastInsertRowid);
  }

  update(where: Dict, data: Dict): Model[] {
    const builder = new Builder({});
    const { sql, params } = builder.table(this._table)
      .where(where)
      .update(data);
    this.db.prepare(sql).run(...params);
    return this.find(where);
  }

  updateAttributes(data: Dict): Model {
    if (!this._pk) {
      throw new Error('updateAttributes must be called on instance');
    }
    const current = this._attributes;
    Object.entries(data).map(item => {
      const [key, value] = item;
      if (has(key, current)) {
        this._changed[key] = value;
      }
    });

    return this.save();
  }

  upsert(data: Dict): Model {
    if (data.id) {
      const record = this.findById(data.id);
      if (record) {
        return record.updateAttributes(data);
      }
    }

    return this.insert(data);
  }

  save(): Model {
    const pk = pick(this._pk, this._attributes);
    if (!this._pk || isEmpty(pk)) {
      throw new Error('save must be called on instance');
    }
    if (!Object.keys(this._changed).length) {
      return this;
    }
    const [instance] = this.update(pk, this._changed);
    return instance;
  }


  remove(): Sqlite.RunResult {
    const pk = pick(this._pk, this._attributes)
    if (!this._pk || isEmpty(pk)) {
      throw new Error('save must be called on instance');
    }

    return this.delete(pk);
  }
  deleteById(id: number): boolean {
    const record = this.findById(id);
    if (!record) {
      return false;
    }
    const builder = new Builder({});
    const { sql, params } = builder.table(this._table)
      .where({ id })
      .delete();
    this.db.prepare(sql).run(...params);
    return true;
  }

  delete(where: Dict): Sqlite.RunResult {
    const builder = new Builder({});
    const { sql, params } = builder.table(this._table)
      .where(where)
      .delete();
    return this.db.prepare(sql).run(...params);
  }
}

