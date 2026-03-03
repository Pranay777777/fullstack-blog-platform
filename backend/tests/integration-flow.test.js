const request = require('supertest');
const app = require('../server');
const { initDatabase, closeDatabase } = require('../src/config/database');
const fs = require('fs');

describe('Integration Flow', () => {
  const testDbPath = './test-integration.db';

  beforeAll(() => {
    process.env.DATABASE_PATH = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key';
    initDatabase();
  });

  afterAll(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    const walPath = `${testDbPath}-wal`;
    const shmPath = `${testDbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  test('user flow: signup, login, create post, comment, approve, like', async () => {
    const userSignup = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'flowuser',
        email: 'flowuser@example.com',
        password: 'password123'
      })
      .expect(201);

    const adminSignup = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'flowadmin',
        email: 'flowadmin@example.com',
        password: 'password123',
        role: 'admin'
      })
      .expect(201);

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'flowuser@example.com',
        password: 'password123'
      })
      .expect(200);

    const userToken = userLogin.body.token;
    const adminToken = adminSignup.body.token;

    const postResponse = await request(app)
      .post('/api/posts')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Flow Post',
        content: 'Flow post content that is long enough.'
      })
      .expect(201);

    const postId = postResponse.body.data.id;

    const commentResponse = await request(app)
      .post('/api/comments')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ postId, content: 'Flow comment' })
      .expect(201);

    const commentId = commentResponse.body.data.id;

    await request(app)
      .put(`/api/comments/approve/${commentId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const likePost = await request(app)
      .post(`/api/likes/post/${postId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(likePost.body.data.likesCount).toBe(1);

    const likeComment = await request(app)
      .post(`/api/likes/comment/${commentId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(likeComment.body.data.likesCount).toBe(1);

    const commentsResponse = await request(app)
      .get(`/api/comments/${postId}`)
      .expect(200);

    expect(commentsResponse.body.data.length).toBe(1);
    expect(commentsResponse.body.data[0].id).toBe(commentId);
  });
});
