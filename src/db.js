import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const {
  DATABASE_URL: connectionString,
} = process.env;

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function query(s, values = []) {
  const client = await pool.connect();

  try {
    const result = await client.query(s, values);
    return result;
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
  }
}

export async function insert(data) {
  const existsCheck = 'SELECT * FROM signatures WHERE nationalId = VALUES($1)';
  const existsCheckValues = [data.nationalId];

  const result = await query(existsCheck, existsCheckValues);

  if (result) {
    return null;
  }

  const q = 'INSERT INTO signatures(name, nationalId, comment, anonymous) VALUES($1, $2, $3, $4)';
  const values = [data.name, data.nationalId, data.comment, data.anonymous];

  return query(q, values);
}

export async function select() {
  const q = 'SELECT name, comment, signed FROM signatures';

  return query(q);
}
