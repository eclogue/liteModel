import { Model } from '../lib';
import path from 'path';

class User extends Model {
  dbFile = path.resolve('./test.db');
  table = 'users';
  constructor() {
    super();
    this.dbFile = './test.db';
    this.table = 'users';
    this.initialize();
  }
}
const model = new User();
const res = model.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name CHAR(50) NOT NULL,
  gender CHAR(10) CHECK(gender IN('male', 'female', 'unknown')) NOT NULL,
  mail CHAR(128) NOT NULL,
  age INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);
// console.log(res);
model.insert({
  name: 'tommy',
  gender: 'male',
  age: 30,
  mail: 'tommy@hello.cc'
});

// model.insert({
//   name: 'jerry',
//   gender: 'female',
//   age: 31,
//   mail: 'jerry@world.cc'
// });
const records = model.findOne({ id: { $gte: 1 } });
console.log(records);
