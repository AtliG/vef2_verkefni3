import { readFile } from 'fs/promises';
import faker from 'faker';
import dotenv from 'dotenv';
import { query, end } from './db.js';
import { createUser } from './login.js';

dotenv.config();

const schemaFile = './sql/schema.sql';

async function mock(num) {
  const q = 'INSERT INTO signatures (name, nationalId, comment, anonymous) VALUES ($1, $2, $3, $4)';

  for (let i = 0; i < num; i += 1) {
    const name = faker.name.findName();
    const nationalId = faker.phone.phoneNumber('##########');
    const comment = faker.lorem.sentence();
    let anonymous = false;

    const anon = Math.random();

    if (anon < 0.3) {
      anonymous = true;
    }

    await query(q, [name, nationalId, comment, anonymous]);
  }
}

async function create() {
  const data = await readFile(schemaFile);

  await query(data.toString('utf-8'));

  console.info('Schema created');

  await mock(500);

  await createUser('admin', 'pass');

  await end();
}

create().catch((err) => {
  console.error('Error creating schema', err);
});
