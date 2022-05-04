import sqlite3 from 'sqlite3'
import { open, Database, ISqlite } from 'sqlite';
import { Connection } from './interface';

export default class DB {
  static instances: { [key: string]: DB } = {};
  db: Database;
  connecting: any;
  private constructor(connection: Promise<Database>) {
    this.db = null;
    this.connecting = connection;
  }

  async connect(): Promise<Database> {
    if (this.connecting) {
      this.db = await this.connecting;
      this.connecting = null;
    }
    return this.db;
  }
  static getInstance(filename: string, options: Partial<ISqlite.Config>): DB {
    if (DB.instances[filename]) {
      return DB.instances[filename];
    }
    const db = open({
      filename,
      driver: sqlite3.cached.Database,
      ...options,
    });
    DB.instances[filename] = new DB(db);
    return DB.instances[filename];
  }


  async exec(sql: string): Promise<void> {
    await this.connect();
    return this.db.exec(sql);
  }

  async call(method: string, sql, params): Promise<any> {
    await this.connect();
    const stmt = await this.db.prepare(sql);
    return stmt[method](params);
  }
}
