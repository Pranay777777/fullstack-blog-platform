const request = require('supertest');
const app = require('../server');
const { initDatabase, closeDatabase, getDatabase } = require('../src/config/database');
const fs = require('fs');

describe('Posts API', () => {
  const testDbPath = './test-posts.db';
  let userToken;
  let userId;
  let user2Token;
  let user2Id;
  let adminToken;
  let adminId;

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
  });

  beforeEach(() => {
    const db = getDatabase();
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

  describe('POST /api/posts', () => {
    test('should create a new post with valid data', async () => {
      const postData = {
        title: 'Test Post Title',
        content: 'This is the content of the test post. It needs to be at least 10 characters.'
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(postData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Post created successfully');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe(postData.title);
      expect(response.body.data.content).toBe(postData.content);
      expect(response.body.data.author_id).toBe(userId);
      expect(response.body.data.author_username).toBe('testuser');
    });

    test('should fail without authentication', async () => {
      const postData = {
        title: 'Test Post',
        content: 'Test content that is long enough'
      };

      const response = await request(app)
        .post('/api/posts')
        .send(postData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should fail with empty title', async () => {
      const postData = {
        title: '',
        content: 'Test content that is long enough'
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Title is required');
    });

    test('should fail with short title', async () => {
      const postData = {
        title: 'ab',
        content: 'Test content that is long enough'
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should fail with short content', async () => {
      const postData = {
        title: 'Valid Title',
        content: 'short'
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('at least 10 characters');
    });

    test('should fail with missing content', async () => {
      const postData = {
        title: 'Valid Title'
      };

      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send(postData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/posts', () => {
    beforeEach(async () => {
      // Create multiple posts with slight delays to ensure order
      for (let i = 1; i <= 15; i++) {
        await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: `Post ${i}`,
            content: `Content for post ${i}. This needs to be longer than 10 characters.`
          });
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 5));
      }
    });

    test('should get all posts with default pagination', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(10); // Default limit
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 15,
        totalPages: 2
      });
    });

    test('should get posts with custom pagination', async () => {
      const response = await request(app)
        .get('/api/posts?page=2&limit=5')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(5);
      expect(response.body.pagination.page).toBe(2);
      expect(response.body.pagination.limit).toBe(5);
    });

    test('should return posts in descending order by creation date', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      // Check that posts are in descending order
      const posts = response.body.data;
      for (let i = 1; i < posts.length; i++) {
        const prevDate = new Date(posts[i - 1].created_at);
        const currDate = new Date(posts[i].created_at);
        expect(prevDate.getTime()).toBeGreaterThanOrEqual(currDate.getTime());
      }
    });

    test('should fail with invalid page number', async () => {
      const response = await request(app)
        .get('/api/posts?page=0')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should fail with limit too high', async () => {
      const response = await request(app)
        .get('/api/posts?limit=101')
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should include author information', async () => {
      const response = await request(app)
        .get('/api/posts')
        .expect(200);

      expect(response.body.data[0]).toHaveProperty('author_username');
      expect(response.body.data[0]).toHaveProperty('author_email');
      expect(response.body.data[0].author_username).toBe('testuser');
    });
  });

  describe('GET /api/posts/:id', () => {
    let postId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Single Post Test',
          content: 'Content for single post test'
        });
      postId = response.body.data.id;
    });

    test('should get a single post by ID', async () => {
      const response = await request(app)
        .get(`/api/posts/${postId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(postId);
      expect(response.body.data.title).toBe('Single Post Test');
      expect(response.body.data.author_username).toBe('testuser');
    });

    test('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/posts/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Post not found');
    });

    test('should include all post details', async () => {
      const response = await request(app)
        .get(`/api/posts/${postId}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('content');
      expect(response.body.data).toHaveProperty('author_id');
      expect(response.body.data).toHaveProperty('author_username');
      expect(response.body.data).toHaveProperty('created_at');
      expect(response.body.data).toHaveProperty('updated_at');
    });
  });

  describe('PUT /api/posts/:id', () => {
    let postId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Original Title',
          content: 'Original content for the post'
        });
      postId = response.body.data.id;
    });

    test('should update own post successfully', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content for the post'
      };

      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Post updated successfully');
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.content).toBe(updateData.content);
    });

    test('should fail to update another user\'s post', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content for the post'
      };

      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Not authorized');
    });

    test('should fail without authentication', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content for the post'
      };

      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent post', async () => {
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content for the post'
      };

      const response = await request(app)
        .put('/api/posts/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(404);

      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid data', async () => {
      const updateData = {
        title: 'ab',
        content: 'Updated content'
      };

      const response = await request(app)
        .put(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send(updateData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/posts/:id', () => {
    let postId;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/posts')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          title: 'Post to Delete',
          content: 'Content for post to delete'
        });
      postId = response.body.data.id;
    });

    test('should delete own post successfully', async () => {
      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Post deleted successfully');

      // Verify post is deleted
      const getResponse = await request(app)
        .get(`/api/posts/${postId}`)
        .expect(404);
    });

    test('should allow admin to delete any post', async () => {
      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should fail for non-author non-admin user', async () => {
      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .set('Authorization', `Bearer ${user2Token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .delete(`/api/posts/${postId}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .delete('/api/posts/99999')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/posts/user/my-posts', () => {
    beforeEach(async () => {
      // Create posts for user1
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${userToken}`)
          .send({
            title: `User1 Post ${i}`,
            content: `Content for user1 post ${i}`
          });
      }

      // Create posts for user2
      for (let i = 1; i <= 2; i++) {
        await request(app)
          .post('/api/posts')
          .set('Authorization', `Bearer ${user2Token}`)
          .send({
            title: `User2 Post ${i}`,
            content: `Content for user2 post ${i}`
          });
      }
    });

    test('should get only logged in user\'s posts', async () => {
      const response = await request(app)
        .get('/api/posts/user/my-posts')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(3);
      expect(response.body.data.every(post => post.author_username === 'testuser')).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/posts/user/my-posts')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});
