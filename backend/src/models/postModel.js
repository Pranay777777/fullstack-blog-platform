const { getDatabase } = require('../config/database');

class PostModel {
  static create({ title, content, author_id, image, status = 'approved' }) {
    const db = getDatabase();
    const stmt = db.prepare(
      'INSERT INTO posts (title, content, author_id, image, status) VALUES (?, ?, ?, ?, ?)'
    );
    const result = stmt.run(title, content, author_id, image || null, status);
    return result.lastInsertRowid;
  }

  static findAll({ page = 1, limit = 10 }) {
    const db = getDatabase();
    const offset = (page - 1) * limit;
    
    const stmt = db.prepare(`
      SELECT 
        posts.id, 
        posts.title, 
        posts.content, 
        posts.author_id,
        posts.image,
        posts.status,
        posts.created_at,
        posts.updated_at,
        users.username as author_username,
        users.email as author_email
      FROM posts
      JOIN users ON posts.author_id = users.id
      WHERE posts.status = 'approved'
      ORDER BY posts.created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    const posts = stmt.all(limit, offset);
    
    // Get total count
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM posts');
    const { count } = countStmt.get();
    
    return {
      posts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  static findById(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        posts.id, 
        posts.title, 
        posts.content, 
        posts.author_id,
        posts.image,
        posts.status,
        posts.created_at,
        posts.updated_at,
        users.username as author_username,
        users.email as author_email,
        users.role as author_role,
        (SELECT COUNT(*) FROM likes WHERE post_id = posts.id) as likes_count
      FROM posts
      JOIN users ON posts.author_id = users.id
      WHERE posts.id = ?
    `);
    return stmt.get(id);
  }

  static update(id, { title, content, image }) {
    const db = getDatabase();
    
    // If image is provided, update it; otherwise keep the old one
    let query, params;
    if (image !== undefined) {
      query = `
        UPDATE posts 
        SET title = ?, content = ?, image = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      params = [title, content, image, id];
    } else {
      query = `
        UPDATE posts 
        SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      params = [title, content, id];
    }
    
    const stmt = db.prepare(query);
    const result = stmt.run(...params);
    return result.changes > 0;
  }

  static delete(id) {
    const db = getDatabase();
    const stmt = db.prepare('DELETE FROM posts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  static updateStatus(id, status) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE posts SET status = ? WHERE id = ?');
    const result = stmt.run(status, id);
    return result.changes > 0;
  }

  static findAllAdmin({ page = 1, limit = 10 }) {
    const db = getDatabase();
    const offset = (page - 1) * limit;
    
    const stmt = db.prepare(`
      SELECT 
        posts.id, 
        posts.title, 
        posts.content, 
        posts.author_id,
        posts.image,
        posts.status,
        posts.created_at,
        posts.updated_at,
        users.username as author_username,
        users.email as author_email
      FROM posts
      JOIN users ON posts.author_id = users.id
      ORDER BY posts.created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    const posts = stmt.all(limit, offset);
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM posts');
    const { count } = countStmt.get();
    
    return {
      posts,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  static findByAuthor(author_id, { page = 1, limit = 10 }) {
    const db = getDatabase();
    const offset = (page - 1) * limit;
    
    const stmt = db.prepare(`
      SELECT 
        posts.id, 
        posts.title, 
        posts.content, 
        posts.author_id,
        posts.created_at,
        posts.updated_at,
        users.username as author_username
      FROM posts
      JOIN users ON posts.author_id = users.id
      WHERE posts.author_id = ?
      ORDER BY posts.created_at DESC
      LIMIT ? OFFSET ?
    `);
    
    return stmt.all(author_id, limit, offset);
  }
}

module.exports = PostModel;
