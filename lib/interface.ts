import { Options } from 'better-sqlite3';
export type Dict = {
  [key: string]: any
}

export interface ColumnSchema {

  type: string;
  name?: string;
  autoTimestamp?: boolean;
  rules?: string[];
  pk?: boolean;
}
export interface Schema {
  [key: string]: ColumnSchema
}

export interface ModelOpts {
  dbFile?: string;
  table?: string;
  dbOptions?: Options;
  schema?: Schema;
}