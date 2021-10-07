import Sqlite from 'better-sqlite3';
import path from 'path';
import Builder from './builder';
import { Dict } from './interface';

export type DeepPartial<T> =
  | Partial<T> // handle free-form properties, e.g. DeepPartial<AnyObject>
  | { [P in keyof T]?: DeepPartial<T[P]> };

export type DataObject<T extends object> = T | DeepPartial<T>;

export default class Base {
  db: any;
  table: string;
  definition: Partial<object>;
  properties: { [name: string]: unknown };
  constructor(db: string, table: string, options: any = {}) {
    this.db = Sqlite(db, {
      timeout: 10000,
      readonly: false,
    });
    this.table = table;
    this.definition = {};
    this.properties = {};
  }

  attr(name: string, value: any) {
    this.properties[name] = value;
  }

  toObject() {
    return {};
  }


  find(options: Dict) {
    const { where = {}, limit, offset, order, fields, group } = options;
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


  findOne(options: Dict = {}) {
    options.limit = 1;
    const res = this.find(options);
    if (res.length) {
      return res[0];
    }
    return null;
  }

  findAll(options: Dict = {}) {
    return this.find(options);
  }

  findById(id: string | number) {
    return this.findOne({ where: { id } });
  }

  findByIds(ids: any[]) {
    return this.findOne({ where: { id: { '$in': ids } } });
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

  deleteById(id: string | number) {
    const record = this.findById(id);
    if (!record) {
      return false;
    }
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table)
      .where({ id })
      .delete();
    return this.db.prepare(sql, params);
  }

  delete(where: Dict) {
    const builder = new Builder({});
    const { sql, params } = builder.table(this.table)
      .where(where)
      .delete();
  }
}

const model = new Base('./test.db', 'COMPANY');

model.insert({ ID: 4, NAME: 'Tommy', AGE: 30, ADDRESS: 'CN', SALARY: 22000 })
const res = model.find({ where: { ID: { '$gte': 1 } } });
console.log(res);
