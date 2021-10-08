import { Dict } from './interface';
export declare type DeepPartial<T> = Partial<T> | {
    [P in keyof T]?: DeepPartial<T[P]>;
};
export declare type DataObject<T extends object> = T | DeepPartial<T>;
export declare class Base {
    db: any;
    table: string;
    definition: Partial<object>;
    properties: {
        [name: string]: unknown;
    };
    constructor(db: string, table: string, options?: any);
    attr(name: string, value: any): void;
    toObject(): {};
    exec(sql: string): any;
    find(options: Dict): any;
    findOne(options?: Dict): any;
    findAll(options?: Dict): any;
    findById(id: string | number): any;
    findByIds(ids: any[]): any;
    insert(data: Dict): any;
    update(where: Dict, data: Dict): any;
    upsert(data: Dict): any;
    save(): void;
    deleteById(id: string | number): any;
    delete(where: Dict): void;
}
