const pool = require('../config/db');

const User = {
  create: async (username, email, password_hash) => {
    const [result] = await pool.execute(
      'INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?)',
      [username, email, password_hash]
    );
    return result;
  },

  findByEmail: async (email) => {
    const [rows] = await pool.execute('SELECT * FROM Users WHERE email = ?', [email]);
    return rows[0];
  },

  findById: async (id) => {
    const [rows] = await pool.execute('SELECT * FROM Users WHERE id = ?', [id]);
    return rows[0];
  },

  updateUsername: async (id, username) => {
    const [result] = await pool.execute(
      'UPDATE Users SET username = ? WHERE id = ?',
      [username, id]
    );
    return result;
  },

  updatePassword: async (id, passwordHash) => {
    const [result] = await pool.execute(
      'UPDATE Users SET password_hash = ? WHERE id = ?',
      [passwordHash, id]
    );
    return result;
  },
};

module.exports = User;

