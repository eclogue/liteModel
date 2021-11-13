import Sqlite from 'better-sqlite3';

export default class Database {
  static instance = null;
  readonly db: Sqlite.Database;
  constructor(file: string, options: Sqlite.Options) {
    this.db = Sqlite(file, options);
  }

  static getInstance(file: string, options: Sqlite.Options = {}): Database {
    if (Database.instance) {
      return Database.instance;
    }
    return new Database(file, options);
  }
}
