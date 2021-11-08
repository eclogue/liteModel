const { Model } = require('../lib/index.js');
const path = require('path');
const Sqlite = require('better-sqlite3');

class User extends Model {
  dbFile = path.resolve('./test.db');
  table = 'users';
  constructor(definition) {
    super(definition);
    this.dbFile = './test.db';
    this.table = 'users';
    this.initialize();
    this.db = Sqlite(this.dbFile, {});
  }
}
const model = new User({ id: { pk: true } });
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
  name: 'tom',
  gender: 'male',
  age: 30,
  mail: 'tom@hello.cc'
});

// model.insert({
//   name: 'jerry',
//   gender: 'female',
//   age: 31,
//   mail: 'jerry@world.cc'
// });
const users = model.find({ id: { $gte: 1 } });
users.map((user) => {
  console.log('>>>>', user);

  user.name = 'Tommy';
  const u1 = user.save();
  console.log('u1', u1);
  u1.name = 'tomm22';
  const u2 = u1.save();
  console.log('u2', u2);
  u2.name = 'tom3';
  console.log('u3', u2.save());
});
