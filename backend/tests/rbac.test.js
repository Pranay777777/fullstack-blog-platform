const request = require('supertest');
const app = require('../server');
const { initDatabase, closeDatabase, getDatabase } = require('../src/config/database');
const fs = require('fs');

describe('Role-Based Access Control (RBAC)', () => {
  const testDbPath = './test-rbac.db';
  let userToken, user2Token, adminToken;
  let userId, user2Id, adminId;

  beforeAll(async () => {
    process.env.DATABASE_PATH = testDbPath;
    process.env.JWT_SECRET = 'test-secret-key';
    initDatabase();

    // Create regular user 1
    const user1Response = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'regularuser1',
        email: 'user1@example.com',
        password: 'password123',
        role: 'user'
      });
    userToken = user1Response.body.token;
    userId = user1Response.body.data.id;

    // Create regular user 2
    const user2Response = await request(app)
      .post('/api/auth/signup')
      .send({
        username: 'regularuser2',
        email: 'user2@example.com',
        password: 'password123',
        role: 'user'
      });
    user2Token = user2Response.body.token;
    user2Id = user2Response.body.data.id;

    // Create admin user
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
  });

  beforeEach(() => {
    const db = getDatabase();
    db.prepare('DELETE FROM comments').run();
    db.prepare('DELETE FROM posts').run();
  });

  afterAll(() => {
    closeDatabase();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    const walPath = `${testDbPath}-wal`;
    const shmPath = `${testDbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  describe('User Role Verification', () => {
    test('should create user with default role', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'defaultuser',
          email: 'default@example.com',
          password: 'password123'
        });

      expect(response.body.data.role).toBe('user');
    });

    test('should create user with explicit user role', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'explicituser',
          email: 'explicit@example.com',
          password: 'password123',
          role: 'user'
        });

      expect(response.body.data.role).toBe('user');
    });

    test('should create user with admin role', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'newadmin',
          email: 'newadmin@example.com',
          password: 'password123',
          role: 'admin'
        });

      expect(response.body.data.role).toBe('admin');
    });

    test('should fail with invalid role', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          username: 'invalidrole',
          email: 'invalid@example.com',
          password: 'password123',
          role: 'superuser'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should include role in JWT token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.role).toBe('admin');
    });
  });

  describe('Admin Post Privileges', () => {
    let userPostId, user2PostId;

    beforeEach(async () => {
      // Create posts from different users
      const post1 = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'User 1 Post',
          content: 'This is user 1 post content'
        });
      userPostId = post1.body.data.id;

      const post2 = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({
          title: 'User 2 Post',
          content: 'This is user 2 post content'
        });
      user2PostId = post2.body.data.id;
    });

    test('admin can delete any user\'s post', async () => {
      const response = await request(app)
        .delete(`/api/posts/${userPostId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Post deleted successfully');
    });

    test('regular user cannot delete another user\'s post', async () => {
      const response = await request(app)
        .delete(`/api/posts/${user2PostId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Not authorized');
    });

    test('user can delete own post', async () => {
      const response = await request(app)
        .delete(`/api/posts/${userPostId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('regular user cannot update another user\'s post', async () => {
      const response = await request(app)
        .put(`/api/posts/${user2PostId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Updated Title',
          content: 'Updated content'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('admin can create posts', async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Admin Post',
          content: 'This is an admin post'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.author_id).toBe(adminId);
    });
  });

  describe('Admin Comment Privileges', () => {
    let postId, userCommentId, user2CommentId;

    beforeEach(async () => {
      // Create a post
      const post = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Post for comments',
          content: 'Post content for comments'
        });
      postId = post.body.data.id;

      // Add comments from different users
      const comment1 = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ postId, content: 'User 1 comment' });
      userCommentId = comment1.body.data.id;

      const comment2 = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${user2Token}`)
        .send({ postId, content: 'User 2 comment' });
      user2CommentId = comment2.body.data.id;
    });

    test('admin can delete any user\'s comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${userCommentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Comment deleted successfully');
    });

    test('admin can delete multiple users\' comments', async () => {
      await request(app)
        .delete(`/api/comments/${userCommentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      await request(app)
        .delete(`/api/comments/${user2CommentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const comments = await request(app)
        .get(`/api/comments/${postId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(comments.body.data.length).toBe(0);
    });

    test('regular user cannot delete another user\'s comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${user2CommentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Not authorized');
    });

    test('user can delete own comment', async () => {
      const response = await request(app)
        .delete(`/api/comments/${userCommentId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('admin can add comments', async () => {
      const response = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ postId, content: 'Admin comment' })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(adminId);
    });
  });

  describe('Role Persistence', () => {
    test('role should persist after login', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body.data.role).toBe('admin');

      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${loginResponse.body.token}`)
        .expect(200);

      expect(meResponse.body.data.role).toBe('admin');
    });

    test('user role should persist after login', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user1@example.com',
          password: 'password123'
        })
        .expect(200);

      expect(loginResponse.body.data.role).toBe('user');
    });
  });

  describe('Cross-Role Interactions', () => {
    test('admin and regular user can collaborate on same post', async () => {
      // User creates post
      const post = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Collaborative Post',
          content: 'Post for collaboration'
        });

      // Admin comments
      const adminComment = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ postId: post.body.data.id, content: 'Admin feedback' })
        .expect(201);

      // User comments
      const userComment = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ postId: post.body.data.id, content: 'User response' })
        .expect(201);

      expect(adminComment.body.success).toBe(true);
      expect(userComment.body.success).toBe(true);
    });

    test('multiple regular users cannot delete each other\'s content', async () => {
      // User 1 creates post
      const post = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'User 1 Post',
          content: 'User 1 content'
        });

      // User 2 tries to delete (should fail)
      await request(app)
        .delete(`/api/posts/${post.body.data.id}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      // Verify post still exists
      const getPost = await request(app)
        .get(`/api/posts/${post.body.data.id}`)
        .expect(200);

      expect(getPost.body.data).toBeDefined();
    });
  });
});
