import { Model, ModelOpts } from '../lib';
import path from 'path';
import assert from 'assert';
const dbFile = path.resolve('./test.db');

const connection = {
  filename: dbFile,
}
class User extends Model {
  _table = 'users';
  constructor(optons: ModelOpts) {
    super(optons);
  }
}
const model = new User({
  schema: { id: { type: 'string', pk: true } },
  connection
});
const main = async () => {
  await model.exec(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name CHAR(50) NOT NULL,
  gender CHAR(10) CHECK(gender IN('male', 'female', 'unknown')) NOT NULL,
  mail CHAR(128) NOT NULL,
  age INT NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`);
  model.insert({
    name: 'tommy',
    gender: 'male',
    age: 30,
    mail: 'tommy@hello.cc'
  });

  const user = await model.findOne({ id: { $gte: 1, $lte: 200 } });
  console.log('current user %j', user.toObject());
  const check = (await user.findById(user.id));
  console.log('check findById %j', check.toObject());
  const u2 = await model.upsert({
    id: user.id + 1,
    name: 'tommy',
    gender: 'male',
    age: user.age + 1,
    mail: 'tommy@hello.cc'
  });
  assert(u2.age === user.age + 1);
  const updated = await u2.updateAttributes({ name: 'tommy2' });
  assert(updated.name === 'tommy2')
  console.log('updated result %j', updated);
  const removed = await user.remove();
  console.log('removed result %j', removed);
  const checkRemoved = await user.findById(user.id);
  assert(checkRemoved === null);
  console.log('check removed result', checkRemoved);

};


main().then(() => process.exit(0));