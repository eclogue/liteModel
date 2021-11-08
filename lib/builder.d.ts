import { Dict } from './interface';
export declare class Builder {
    sql: Dict;
    _fields: string[];
    tableName: string;
    values: Dict;
    private parser;
    options: Dict;
    constructor(options: any);
    table(table: string): Builder;
    isEmpty(data: any): boolean;
    fields(fields: string[]): Builder;
    where(condition: any): Builder;
    order(orderBy: Dict): Builder;
    limit(limit: number): Builder;
    offset(offset: number): Builder;
    group(field: string | string[]): this;
    select(options?: Dict | null): {
        sql: string;
        params: any[];
    };
    delete(): {
        sql: string;
        params: any[];
    };
    update(data: Dict, options?: Dict): {
        sql: string;
        params: any[];
    };
    insert(data: Dict): {
        sql: string;
        params: any[];
    };
    toSql(): {
        sql: string;
        params: any[];
    };
    free(): void;
}
