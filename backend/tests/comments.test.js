const request = require('supertest');
const app = require('../server');
const { initDatabase, closeDatabase, getDatabase } = require('../src/config/database');
const fs = require('fs');

describe('Comments API', () => {
  const testDbPath = './test-comments.db';
  let userToken, user2Token, adminToken;
  let userId, user2Id, adminId;
  let postId;

  beforeAll(async () => {
    process.env.DATABASE_PATH = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key';
    initDatabase();

    // Create test users
    const userResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      });
    userToken = userResponse.body.token;
    userId = userResponse.body.data.id;

    const user2Response = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'testuser2',
        email: 'test2@example.com',
        password: 'password123'
      });
    user2Token = user2Response.body.token;
    user2Id = user2Response.body.data.id;

    const adminResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'adminuser',
        email: 'admin@example.com',
        password: 'password123',
        role: 'admin'
      });
    adminToken = adminResponse.body.token;
    adminId = adminResponse.body.data.id;

    // Create a test post
    const postResponse = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Test Post for Comments',
        content: 'This is a test post for testing comments functionality'
      });
    postId = postResponse.body.data.id;
  });

  beforeEach(() => {
    const db = getDatabase();
    db.prepare('DELETE FROM comments').run();
  });

  afterAll(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    const walPath = `${testDbPath}-wal`;
    const shmPath = `${testDbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  describe('POST /api/comments/:postId', () => {
    test('should add a comment to a post', async () => {
      const commentData = {
        content: 'This is a test comment'
      };

      const response = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(commentData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Comment added successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.content).toBe(commentData.content);
      expect(response.body.data.post_id).toBe(postId);
      expect(response.body.data.user_id).toBe(userId);
      expect(response.body.data.user_username).toBe('testuser');
    });

    test('should fail without authentication', async () => {
      const commentData = {
        content: 'Test comment'
      };

      const response = await request(app)
        .post(`/api/comments/${postId}`)
        .send(commentData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should fail with empty content', async () => {
      const commentData = {
        content: ''
      };

      const response = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(commentData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    test('should fail with missing content', async () => {
      const response = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should fail for non-existent post', async () => {
      const commentData = {
        content: 'Comment on non-existent post'
      };

      const response = await request(app)
        .post('/api/comments/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .send(commentData)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Post not found');
    });

    test('should fail with content too long', async () => {
      const commentData = {
        content: 'a'.repeat(1001)
      };

      const response = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(commentData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should allow multiple comments on same post', async () => {
      const comment1 = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'First comment' })
        .expect(201);

      const comment2 = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Second comment' })
        .expect(201);

      expect(comment1.body.data.id).not.toBe(comment2.body.data.id);
    });
  });

  describe('GET /api/comments/:postId', () => {
    beforeEach(async () => {
      // Add some comments
      await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'First comment' });

      await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Second comment' });

      await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Third comment' });
    });

    test('should get all comments for a post', async () => {
      const response = await request(app)
        .get(`/api/comments/${postId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(3);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3);
    });

    test('should include user information with comments', async () => {
      const response = await request(app)
        .get(`/api/comments/${postId}`)
        .expect(200);

      expect(response.body.data[0]).toHaveProperty('user_username');
      expect(response.body.data[0]).toHaveProperty('user_email');
    });

    test('should return comments in descending order by creation date', async () => {
      const response = await request(app)
        .get(`/api/comments/${postId}`)
        .expect(200);

      const dates = response.body.data.map(comment => new Date(comment.created_at).getTime());
      for (let i = 1; i < dates.length; i++) {
        expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i]);
      }
    });

    test('should return empty array for post with no comments', async () => {
      // Create a new post with no comments
      const newPost = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Post without comments',
          content: 'This post has no comments'
        });

      const response = await request(app)
        .get(`/api/comments/${newPost.body.data.id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(0);
      expect(response.body.data).toEqual([]);
    });

    test('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/comments/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Post not found');
    });

    test('should be accessible without authentication', async () => {
      const response = await request(app)
        .get(`/api/comments/${postId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/comments/:id', () => {
    let commentId;
    let user2CommentId;

    beforeEach(async () => {
      // Create comments
      const comment1 = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'User 1 comment' });
      commentId = comment1.body.data.id;

      const comment2 = await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'User 2 comment' });
      user2CommentId = comment2.body.data.id;
    });

    test('should delete own comment successfully', async () => {
      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Comment deleted successfully');

      // Verify comment is deleted
      const comments = await request(app)
        .get(`/api/comments/${postId}`)
        .expect(200);

      expect(comments.body.data.find(c => c.id === commentId)).toBeUndefined();
    });

    test('should allow admin to delete any comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${user2CommentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should fail to delete another user\'s comment (non-admin)', async () => {
      const response = await request(app)
        .delete(`/api/comments/${user2CommentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Not authorized');
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/comments/${commentId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent comment', async () => {
      const response = await request(app)
        .delete('/api/comments/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Comment not found');
    });
  });

  describe('Comments Integration', () => {
    test('should delete all comments when post is deleted', async () => {
      // Add comments to post
      await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ content: 'Comment 1' });

      await request(app)
        .post(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ content: 'Comment 2' });

      // Delete the post
      await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      // Verify comments are deleted (cascade)
      const db = getDatabase();
      const comments = db.prepare('SELECT * FROM comments WHERE post_id = ?').all(postId);
      expect(comments.length).toBe(0);
    });
  });
});
