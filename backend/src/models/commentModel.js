const { getDatabase } = require('../config/database');

class CommentModel {
  static create({ content, post_id, user_id }) {
    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT INTO comments (content, post_id, user_id) VALUES (?, ?, ?)'
    );
    const result = stmt.run(content, post_id, user_id);
    return result.lastInsertRowid;
  }

  static findByPostId(post_id) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        comments.id,
        comments.content,
        comments.post_id,
        comments.user_id,
        comments.created_at,
        users.username as user_username,
        users.email as user_email
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.created_at DESC
    `);
    return stmt.all(post_id);
  }

  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        comments.id,
        comments.content,
        comments.post_id,
        comments.user_id,
        comments.created_at,
        users.username as user_username
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.id = ?
    `);
    return stmt.get(id);
  }

  static delete(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM comments WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static countByPostId(post_id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM comments WHERE post_id = ?');
    const result = stmt.get(post_id);
    return result.count;
  }
}

module.exports = CommentModel;
