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
  }
};

module.exports = User;
