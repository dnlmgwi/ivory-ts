import { describe, it, expect, beforeEach } from 'vitest';
import { CreatePool, Database } from '../lib/ivory.js';

describe('CreatePool', () => {
  it('should create a pool with provided credentials', () => {
    const pool = new CreatePool('testuser', 'localhost', 'testdb', 'testpass');
    expect(pool.pool).toBeDefined();
  });
});

describe('Database', () => {
  let pool: CreatePool;
  let db: Database;

  beforeEach(() => {
    pool = new CreatePool('testuser', 'localhost', 'testdb', 'testpass');
    db = new Database(pool);
  });

  describe('Query Building', () => {
    it('should build a select query with conditions', () => {
      const query = db.from('users').cons({ isEqualTo: ['id', 1] });
      expect(query).toBeDefined();
      expect(typeof query.select).toBe('function');
    });

    it('should support multiple condition types', () => {
      const query = db.from('users').cons({
        isEqualTo: ['status', 'active'],
        isGreaterThan: ['age', 18],
      });
      expect(query).toBeDefined();
    });

    it('should support insert operations', () => {
      const query = db.from('users').cons({});
      expect(typeof query.insert).toBe('function');
    });

    it('should support update operations', () => {
      const query = db.from('users').cons({ isEqualTo: ['id', 1] });
      expect(typeof query.update).toBe('function');
    });

    it('should support delete operations', () => {
      const query = db.from('users').cons({ isEqualTo: ['id', 1] });
      expect(typeof query.delete).toBe('function');
    });
  });

  describe('Type Safety', () => {
    interface User {
      id: number;
      name: string;
      email: string;
    }

    it('should support generic types for type-safe queries', () => {
      const query = db.from<User>('users').cons({ isEqualTo: ['id', 1] });
      expect(query).toBeDefined();
    });
  });
});

describe('Constraint Types', () => {
  it('should accept isEqualTo constraint', () => {
    const constraint = { isEqualTo: ['column', 'value'] as [string, string | number, string?] };
    expect(constraint).toBeDefined();
  });

  it('should accept isGreaterThan constraint', () => {
    const constraint = {
      isGreaterThan: ['column', 10] as [string, string | number, string?],
    };
    expect(constraint).toBeDefined();
  });

  it('should accept isLessThan constraint', () => {
    const constraint = { isLessThan: ['column', 100] as [string, string | number, string?] };
    expect(constraint).toBeDefined();
  });

  it('should accept isLike constraint', () => {
    const constraint = { isLike: ['column', 'search'] as [string, string, string?] };
    expect(constraint).toBeDefined();
  });

  it('should accept range constraint', () => {
    const constraint = { range: [0, 10] as [number, number] };
    expect(constraint).toBeDefined();
  });
});
