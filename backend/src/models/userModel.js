const { getDatabase } = require('../config/database');
const bcrypt = require('bcrypt');

class UserModel {
  static create({ username, email, password, role = 'user' }) {
    const db = getDatabase();
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const stmt = db.prepare(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
    );
    
    const result = stmt.run(username, email, hashedPassword, role);
    return result.lastInsertRowid;
  }

  static findByEmail(email) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  }

  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static findByUsername(username) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static comparePassword(plainPassword, hashedPassword) {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  static getAllUsers() {
    const db = getDatabase();
    const stmt = db.prepare('SELECT id, username, email, role, created_at FROM users');
    return stmt.all();
  }

  static update(id, { username, email, password }) {
    const db = getDatabase();
    
    // Build dynamic query based on what fields are provided
    const updates = [];
    const params = [];

    if (username) {
      updates.push('username = ?');
      params.push(username);
    }
    if (email) {
      updates.push('email = ?');
      params.push(email);
    }
    if (password) {
      updates.push('password = ?');
      const hashedPassword = bcrypt.hashSync(password, 10);
      params.push(hashedPassword);
    }

    if (updates.length === 0) {
      return false;
    }

    params.push(id);
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    const stmt = db.prepare(query);
    const result = stmt.run(...params);
    return result.changes > 0;
  }
}

module.exports = UserModel;
