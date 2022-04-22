import { Model, Schema } from '../lib';
import path from 'path';
const dbFile = path.resolve('./test.db');
class User extends Model {
  _table = 'users';
  constructor(options) {
    super(options);
  }
}
const model = new User({
  dbFile,
  schema: { id: { type: 'string', pk: true } }
});
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

const user = model.findOne({ id: { $gte: 1, $lte: 200 } }).toJSON();
console.log('uuuuuuuuuu', user);
const u2 = model.upsert({
  id: user.id,
  name: 'tommy',
  gender: 'male',
  age: user.age + 1,
  mail: 'tommy@hello.cc'
}) as any;
console.log(user.name, u2.age);
