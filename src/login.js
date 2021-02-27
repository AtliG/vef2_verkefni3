import bcrypt from 'bcrypt';
import { query } from './db.js';

export async function findByUsername(username) {
  // Find uname in db
  const q = 'SELECT * FROM users WHERE username = $1';

  try {
    const result = await query(q, [username]);

    if (result.rowCount === 1) {
      return result.rows[0];
    }
  } catch (e) {
    console.error('Could not find user by username.');
    return null;
  }

  return null;
}

export async function comparePasswords(password, hash) {
  // Compare passwords
  const result = await bcrypt.compare(password, hash);

  return result;
}

export async function findById(id) {
  const q = 'SELECT * FROM users WHERE id = $1';

  try {
    const result = await query(q, [id]);

    if (result.rowCount === 1) {
      return result.rows[0];
    }
  } catch (e) {
    console.error('Could not find user by id.');
    return null;
  }

  return null;
}

export async function createUser(username, password) {
  const hashedPassword = await bcrypt.hash(password, 11);

  const q = `
INSERT INTO 
users (username,password) 
VALUES ($1,$2)
RETURNING *
`;

  try {
    const result = await query(q, [username, hashedPassword]);
    return result.rows[0];
  } catch (e) {
    console.error('Could not create user');
  }

  return null;
}
