import { Dict } from './interface';
interface Node {
    type: string;
    name: string;
    value: any;
    isChild: boolean;
    connector?: string;
}
export declare class Parser {
    private tree;
    constructor();
    genNode(entities: any, isChild?: boolean): void;
    getDefaultNode(isChild: boolean): Node;
    parse(entities: any): {
        sql: string;
        params: any[];
    };
    parseFieldNode(node: Node): Dict;
    parseLogicalNode(node: Node): string;
    private increment;
    private sqlFunction;
    free(): void;
}
export {};
