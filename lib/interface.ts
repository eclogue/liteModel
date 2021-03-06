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

export interface Connection {
  filename: string;
  mode?: number;
  driver?: any;
}

export interface ModelOpts {
  table?: string;
  connection?: Connection;
  schema?: Schema;
}
