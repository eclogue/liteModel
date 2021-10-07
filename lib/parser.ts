import R, { any } from 'ramda';
import { sprintf } from 'printj'
import { Dict } from './interface';


const OPERATOR: Dict = {
  '$eq': '=',
  '$neq': '!=',
  '$gt': '>',
  '$lt': '<',
  '$gte': '>=',
  '$lte': '<=',
  '$like': 'LIKE',
  '$isNull': 'IS NULL',
  '$isNotNull': 'IS NOT NULL',
  '$inc': true,
};

const LOGICAL: Dict = {
  $and: 'AND',
  $or: 'OR',
  $xor: 'XOR'
}

interface Node {
  type: string;
  name: string;
  value: any;
  isChild: boolean;
  connector?: string;
}

export default class Parser {
  private tree: Node[];
  constructor() {
    this.tree = [];
  }

  genNode(entities: any, isChild: boolean = false) {
    Object.entries(entities).forEach((item: any[]) => {
      const key: string = item[0];
      const v: any = item[1];
      const value = v && typeof v === 'object' ? v : { $eq: v };
      if (!(key in LOGICAL)) {
        if (Array.isArray(value)) {
          value.forEach(i => {
            this.genNode(i, true);
          });
        } else {
          Object.keys(value).map(op => {
            const node: Node = {
              type: 'field',
              name: key,
              value: { [op]: value[op] },
              isChild: true,
              connector: ' AND '
            };
            this.tree.push(node);
          });
        }
      } else {
        const node: Node = {
          type: 'logical',
          name: R.prop(key, LOGICAL),
          value,
          isChild,
        };
        this.tree.push(node);
        this.genNode(value, true);
      }
    });
  }

  getDefaultNode(isChild: boolean): Node {
    return {
      type: 'operator',
      name: 'and',
      value: isChild ? 0 : 1,
      isChild,
    };
  }


  parse(entities: any) {
    this.genNode(entities);
    const sql: string[] = [];
    let prev: Node;
    let level = 0;
    const params: any[] = [];
    this.tree.forEach((node: Node) => {
      if (node.type === 'field') {
        if (prev && prev.type !== 'field') {
          sql.push(')')
        }
        const res = this.parseFieldNode(node);
        sql.push(res.sql);
        res.values.map((v: any) => params.push(v));
      } else {
        sql.push(this.parseLogicalNode(node));
        if (!node.isChild) {
          sql.push('(');
          level += 1;
        } else if (level) {
          sql.push(')');
          level -= 1;
        }
      }
      prev = node;
    });
    if (level) {
      sql.push(')');
    }
    this.free();
    return { sql: sql.join('').replace(/(.*)and/i, '$1'), params };
  }

  parseFieldNode(node: Node): Dict {
    let fieldStr = '';
    const field = '`' + node.name + '`';
    const connector = node.connector?.toUpperCase().substr(1);
    const values: any[] = [];
    Object.entries(node.value).forEach(element => {
      const operator: string = element[0];
      const value: any = element[1];
      const name = `$${node.name}`;
      const temp: any[] = [field];
      if (operator === '$inc') {
        temp.push(this.increment(node.name, value));
      } else if (OPERATOR[operator]) {
        temp.push(OPERATOR[operator]);
        temp.push('?')
        values.push(value);
      } else {
        const func = this.sqlFunction(operator);
        temp.push(sprintf(func, name));
        values.push({ [name]: value?.toString() });
      }
      temp.push(connector);
      fieldStr += temp.join(' ');
    });
    return { sql: fieldStr, values };
  }

  parseLogicalNode(node: Node): string {
    return ` ${node.name} `;
  }

  private increment(field: string, value: any) {
    if (isNaN(value)) {
      throw new Error('mews increment value must be number');
    }

    return '=`' + field + '` + ' + value;
  }

  private sqlFunction(name: string): string {
    return name.toUpperCase().replace('$', '') + ' (%s) ';
  }

  free() {
    this.tree = [];
  }
}


// let p = new Parser();
// let r = p.parse({ a: 1, b: { $gt: 7, $lt: 9 }, c: { $in: [3, 4, 5] } });
// console.log('%j', r);