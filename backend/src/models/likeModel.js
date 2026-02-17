const { getDatabase } = require('../config/database');

class LikeModel {
  static togglePostLike(user_id, post_id) {
    const db = getDatabase();
    
    // Check if like exists
    const existingLike = db.prepare(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ?'
    ).get(user_id, post_id);

    if (existingLike) {
      // Unlike
      const stmt = db.prepare('DELETE FROM likes WHERE user_id = ? AND post_id = ?');
      stmt.run(user_id, post_id);
      return { liked: false };
    } else {
      // Like
      const stmt = db.prepare('INSERT INTO likes (user_id, post_id) VALUES (?, ?)');
      stmt.run(user_id, post_id);
      return { liked: true };
    }
  }

  static getPostLikes(post_id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM likes WHERE post_id = ?');
    const { count } = stmt.get(post_id);
    return count;
  }

  static isPostLikedByUser(user_id, post_id) {
    const db = getDatabase();
    const like = db.prepare(
      'SELECT id FROM likes WHERE user_id = ? AND post_id = ?'
    ).get(user_id, post_id);
    return !!like;
  }

  static toggleCommentLike(user_id, comment_id) {
    const db = getDatabase();
    
    const existingLike = db.prepare(
      'SELECT id FROM likes WHERE user_id = ? AND comment_id = ?'
    ).get(user_id, comment_id);

    if (existingLike) {
      const stmt = db.prepare('DELETE FROM likes WHERE user_id = ? AND comment_id = ?');
      stmt.run(user_id, comment_id);
      return { liked: false };
    } else {
      const stmt = db.prepare('INSERT INTO likes (user_id, comment_id) VALUES (?, ?)');
      stmt.run(user_id, comment_id);
      return { liked: true };
    }
  }

  static getCommentLikes(comment_id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT COUNT(*) as count FROM likes WHERE comment_id = ?');
    const { count } = stmt.get(comment_id);
    return count;
  }
}

module.exports = LikeModel;
