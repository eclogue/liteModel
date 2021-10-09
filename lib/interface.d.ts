export type Dict = {
  [key: string]: any
}


interface Schema {
  name: string;
  type: string;
  autoTimestamp?: boolean;
  rules?: string[];
  pk?: boolean;
}
export interface Definition {
  [key: string]: Schema
}