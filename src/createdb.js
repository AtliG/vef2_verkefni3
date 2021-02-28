import { readFile } from 'fs/promises';
import faker from 'faker';
import dotenv from 'dotenv';
import { query, end } from './db.js';

dotenv.config();

const schemaFile = './sql/schema.sql';

async function mock(num) {
  const q = 'INSERT INTO signatures (name, nationalId, comment, anonymous, signed) VALUES ($1, $2, $3, $4, $5)';

  for (let i = 0; i < num; i += 1) {
    let name = faker.name.findName();
    const nationalId = Math.floor(Math.random() * 10000000000);
    let comment = '';
    let anonymous = false;
    const signed = faker.date.between('2021-02-13', '2021-02-27');

    const comm = Math.random();

    if (comm < 0.5) {
      comment = faker.lorem.sentence();
    }

    const anon = Math.random();

    if (anon < 0.5) {
      anonymous = true;
      name = 'Nafnlaust';
    }

    await query(q, [name, nationalId, comment, anonymous, signed]);
  }
}

async function create() {
  const data = await readFile(schemaFile);

  await query(data.toString('utf-8'));

  console.info('Schema created');

  await mock(500);

  await end();
}

create().catch((err) => {
  console.error('Error creating schema', err);
});
