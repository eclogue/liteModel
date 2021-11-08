import { Parser } from "./parser";
import { Dict } from './interface';
import { sprintf } from 'printj';


export class Builder {
  sql: Dict;
  _fields: string[];
  tableName: string;
  values: Dict;
  private parser: Parser;
  options: Dict;

  constructor(options: any) {
    this.options = options;
    this.parser = new Parser();
    this.tableName = '';
    this._fields = [];
    this.values = [];
    this.sql = {};
  }

  table(table: string): Builder {
    this.tableName = table;
    return this;
  }

  isEmpty(data: any): boolean {
    if (!data) {
      return true;
    }
    if (Array.isArray(data)) {
      return !Boolean(data.length);
    }
    return !Boolean(Object.keys(data).length);
  }

  fields(fields: string[]): Builder {
    if (this.isEmpty(fields)) {
      return this;
    }
    this._fields = fields;
    return this;
  }

  where(condition: any): Builder {
    if (this.isEmpty(condition)) {
      return this;
    }
    const { sql, params } = this.parser.parse(condition);
    this.sql.where = { sql: `WHERE ${sql}`, params };
    return this;
  }

  order(orderBy: Dict): Builder {
    if (this.isEmpty(orderBy)) {
      return this;
    }
    Object.entries(orderBy).forEach((elm => {
      const [field, sort] = elm;
      this.sql.order = { sql: `ORDER BY ? ?`, params: [field, sort] };
    }))
    return this;
  }

  limit(limit: number): Builder {
    if (!limit) {
      return this;
    }
    this.sql.limit = { sql: `LIMIT ?`, params: [limit] };
    return this;
  }

  offset(offset: number): Builder {
    if (!offset) {
      return this;
    }
    this.sql.offset = { sql: `OFFSET ?`, params: [offset] };
    return this;
  }

  group(field: string | string[]) {
    if (this.isEmpty(field)) {
      return this;
    }
    this.sql.group = {
      sql: `GROUP BY ?`,
      params: [field?.toString()]
    };
    return this;
  }

  select(options: Dict | null = null) {
    const select = 'SELECT %s FROM `%s` %s';
    const fields = this.isEmpty(this._fields) ? '*' : this._fields.join(',');
    const { sql, params } = this.toSql();
    const sqlStr = sprintf(select, fields, this.tableName, sql);
    this.free();
    return { sql: sqlStr, params };
  }

  delete() {
    const delSql = 'DELETE FROM `%s` %s'
    const { sql, params } = this.toSql();
    const sqlStr = sprintf(delSql, this.tableName, sql);
    this.free();
    return { sql: sqlStr, params };
  }

  update(data: Dict, options: Dict = {}) {
    const setSql: string[] = [];
    const changed = [];
    Object.entries(data).forEach(elm => {
      const [field, value] = elm;
      if (value && value.$inc) {
        setSql.push(`\`${field}\`=\`${field}\` + ${value.inc}`);
      } else {
        setSql.push(`${field}=?`);
        changed.push(value?.toString())
      }
    });
    const { sql, params } = this.toSql();
    params.map(i => changed.push(i));
    const upSql = `UPDATE \`%s\` SET %s %s`;
    const sqlStr = sprintf(upSql, this.tableName, setSql.join(','), sql);
    this.free();
    return { sql: sqlStr, params: changed };
  }

  insert(data: Dict) {
    const fields: string[] = [];
    const params: any[] = [];
    for (const field in data) {
      fields.push(`\`${field}\``);
      params.push(data[field]);
    }
    const fieldStr = fields.join(',');
    const placeholder = fields.map(_ => '?').join(',');
    const sql = 'INSERT INTO `%s` (%s) VALUES (%s)';
    const preSql = sprintf(sql, this.tableName, fieldStr, placeholder);
    return { sql: preSql, params };
  }

  toSql() {
    const sqlObj: string[] = [];
    const values: any[] = []
    const sequence = ['where', 'group', 'order', 'offset', 'limit'];
    sequence.forEach(item => {
      if (!this.sql[item]) {
        return;
      }
      const { sql, params } = this.sql[item];
      sqlObj.push(sql);
      if (Array.isArray(params)) {
        params.map(v => values.push(v));
      } else {
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
}
