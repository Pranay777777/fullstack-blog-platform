const { initDatabase, getDatabase, closeDatabase } = require('../src/config/database');
const fs = require('fs');
const path = require('path');

describe('Database Connection', () => {
  const testDbPath = './test-blog.db';

  beforeAll(() => {
    // Set test database path
    process.env.DATABASE_PATH = testDbPath;
  });

  afterAll(() => {
    // Close database connection
    closeDatabase();
    
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    const walPath = `${testDbPath}-wal`;
    const shmPath = `${testDbPath}-shm`;
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
  });

  test('should initialize database successfully', () => {
    const db = initDatabase();
    expect(db).toBeDefined();
  });

  test('should create users table', () => {
    const db = getDatabase();
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
    expect(tableInfo).toBeDefined();
    expect(tableInfo.name).toBe('users');
  });

  test('should create posts table', () => {
    const db = getDatabase();
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='posts'").get();
    expect(tableInfo).toBeDefined();
    expect(tableInfo.name).toBe('posts');
  });

  test('should create comments table', () => {
    const db = getDatabase();
    const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='comments'").get();
    expect(tableInfo).toBeDefined();
    expect(tableInfo.name).toBe('comments');
  });

  test('should have correct users table schema', () => {
    const db = getDatabase();
    const columns = db.prepare("PRAGMA table_info(users)").all();
    const columnNames = columns.map(col => col.name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('username');
    expect(columnNames).toContain('email');
    expect(columnNames).toContain('password');
    expect(columnNames).toContain('role');
    expect(columnNames).toContain('created_at');
  });

  test('should have correct posts table schema', () => {
    const db = getDatabase();
    const columns = db.prepare("PRAGMA table_info(posts)").all();
    const columnNames = columns.map(col => col.name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('title');
    expect(columnNames).toContain('content');
    expect(columnNames).toContain('author_id');
    expect(columnNames).toContain('created_at');
    expect(columnNames).toContain('updated_at');
  });

  test('should have correct comments table schema', () => {
    const db = getDatabase();
    const columns = db.prepare("PRAGMA table_info(comments)").all();
    const columnNames = columns.map(col => col.name);
    
    expect(columnNames).toContain('id');
    expect(columnNames).toContain('content');
    expect(columnNames).toContain('post_id');
    expect(columnNames).toContain('user_id');
    expect(columnNames).toContain('created_at');
  });

  test('should create indexes for performance', () => {
    const db = getDatabase();
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index'").all();
    const indexNames = indexes.map(idx => idx.name);
    
    expect(indexNames).toContain('idx_posts_author');
    expect(indexNames).toContain('idx_comments_post');
    expect(indexNames).toContain('idx_comments_user');
  });
});
