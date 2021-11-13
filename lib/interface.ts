import { Options } from 'better-sqlite3';
export type Dict = {
  [key: string]: any
}

export interface ColumnSchema {
  name: string;
  type: string;
  autoTimestamp?: boolean;
  rules?: string[];
  pk?: boolean;
}
export interface Schema {
  [key: string]: ColumnSchema
}

export interface ModelOpts {
  dbFile: string;
  table: string;
  dbOptions: Options;
  schema: Schema;
}