import { Dict, Definition } from './interface';
export declare class Model {
    db: any;
    readonly dbFile: string;
    table: string;
    definition: Definition;
    attributes: Dict;
    changed: Dict;
    pk: string;
    constructor(db: string, table: string, definition?: Definition);
    initialize(): void;
    attr(name: string, value: any): void;
    instance(data: Dict): any;
    toObject(): Dict;
    toJSON(): any;
    exec(sql: string): any;
    find(where: Dict, options?: Dict): any;
    findOne(where: Dict, options?: Dict): any;
    findAll(where: Dict, options?: Dict): any;
    findById(id: string | number): any;
    findByIds(ids: any[]): any;
    insert(data: Dict): any;
    update(where: Dict, data: Dict): any;
    upsert(data: Dict): any;
    save(): any;
    deleteById(id: string | number): any;
    delete(where: Dict): any;
}
