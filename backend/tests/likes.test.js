const request = require('supertest');
const app = require('../server');
const { initDatabase, closeDatabase, getDatabase } = require('../src/config/database');
const fs = require('fs');

describe('Likes API', () => {
  const testDbPath = './test-likes.db';
  let userToken;
  let adminToken;
  let postId;
  let commentId;

  beforeAll(async () => {
    process.env.DATABASE_PATH = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key';
    initDatabase();

    const userResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'likeuser',
        email: 'likeuser@example.com',
        password: 'password123'
      });
    userToken = userResponse.body.token;

    const adminResponse = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'likeadmin',
        email: 'likeadmin@example.com',
        password: 'password123',
        role: 'admin'
      });
    adminToken = adminResponse.body.token;

    const postResponse = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Like Test Post',
        content: 'This is a post for like tests with enough content.'
      });
    postId = postResponse.body.data.id;

    const commentResponse = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ postId, content: 'Like this comment' });
    commentId = commentResponse.body.data.id;
  });

  beforeEach(() => {
    const db = getDatabase();
    db.prepare('DELETE FROM likes').run();
  });

  afterAll(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    const walPath = `${testDbPath}-wal`;
    const shmPath = `${testDbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  describe('POST /api/likes/post/:id', () => {
    test('should toggle post like and return count', async () => {
      const likeResponse = await request(app)
        .post(`/api/likes/post/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(likeResponse.body.success).toBe(true);
      expect(likeResponse.body.data.likesCount).toBe(1);
      expect(likeResponse.body.data.liked).toBe(true);

      const unlikeResponse = await request(app)
        .post(`/api/likes/post/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(unlikeResponse.body.data.likesCount).toBe(0);
      expect(unlikeResponse.body.data.liked).toBe(false);
    });
  });

  describe('POST /api/likes/comment/:id', () => {
    test('should toggle comment like and reflect in comment list', async () => {
      const likeResponse = await request(app)
        .post(`/api/likes/comment/${commentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(likeResponse.body.success).toBe(true);
      expect(likeResponse.body.data.likesCount).toBe(1);
      expect(likeResponse.body.data.liked).toBe(true);

      const commentsResponse = await request(app)
        .get(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const updated = commentsResponse.body.data.find((comment) => comment.id === commentId);
      expect(updated.like_count).toBe(1);
    });
  });
});
