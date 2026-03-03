import type { Pool as PoolType, QueryResult } from 'pg';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: '1234',
});

export interface PoolOptions {
  user: string;
  host: string;
  database: string;
  password: string;
}

export class CreatePool {
  pool: PoolType;

  constructor(user: string, host: string, database: string, password: string) {
    this.pool = new Pool({
      user,
      host,
      database,
      password,
    });
  }
}

export interface Constraint {
  isEqualTo?: [string, string | number, string?];
  isGreaterThan?: [string, string | number, string?];
  isLessThan?: [string, string | number, string?];
  isLike?: [string, string, string?];
  range?: [number, number];
  [key: string]: unknown;
}

export interface QueryOperations<T = unknown> {
  select: (cols: string[] | '*') => Promise<T[]>;
  update: (changes: Record<string, unknown>) => Promise<void>;
  delete: () => Promise<void>;
  insert: (newRow: Record<string, unknown>) => Promise<void>;
}

export interface TableOperations<T = unknown> {
  cons: (cons?: Constraint) => QueryOperations<T>;
}

export interface ErrorDebug {
  query: string;
  code: string;
  message: string;
  position?: string;
  hint?: string;
}

export class Database {
  pool: PoolType;

  async exe(query: string): Promise<QueryResult> {
    const res = await pool.query(query);
    return res;
  }

  async insert(query: string): Promise<void> {
    await this.exe(query);
    console.log('INSERTED');
  }

  async select(query: string): Promise<unknown[]> {
    const res = await this.exe(query);
    return res.rows as unknown[];
  }

  async update(query: string): Promise<void> {
    await this.exe(query);
    console.log('Updated');
  }

  async delete(query: string): Promise<void> {
    await this.exe(query);
    console.log('Deleted');
  }

  from<T = unknown>(tablename: string): TableOperations<T> {
    return {
      cons: (cons?: Constraint): QueryOperations<T> => {
        return {
          select: async (cols: string[] | '*'): Promise<T[]> => {
            const query = createQuery(tablename, cons, cols, 'select');
            console.log(query);
            try {
              return (await this.select(query)) as T[];
            } catch (e) {
              return debug(e, query);
            }
          },

          update: async (changes: Record<string, unknown>): Promise<void> => {
            const query = createQuery(tablename, cons, changes, 'update');
            try {
              return await this.update(query);
            } catch (e) {
              return debug(e, query);
            }
          },

          delete: async (): Promise<void> => {
            const query = createQuery(tablename, cons, null, 'delete');
            try {
              return await this.delete(query);
            } catch (e) {
              return debug(e, query);
            }
          },

          insert: async (newRow: Record<string, unknown>): Promise<void> => {
            let query = `INSERT INTO ${tablename} (`;
            query += `${Array.from(Object.keys(newRow)).join(', ')}) `;
            query += `VALUES ('${Array.from(Object.values(newRow)).join("', '")}')`;

            try {
              return await this.insert(query);
            } catch (e) {
              return debug(e, query);
            }
          },
        };
      },
    };
  }

  constructor(pool: CreatePool) {
    this.pool = pool.pool;
  }
}

function createSqlCons(cons: Constraint): string {
  const evalCons: string[] = [];
  const keys = Object.keys(cons);
  const values = Object.values(cons);

  for (let k = 0; k < keys.length; k++) {
    const key = keys[k];
    const value = values[k] as string | [string, string | number, string?];
    const operand = typeof value === 'string' ? null : value[2];

    switch (key) {
      case 'isEqualTo':
        if (Array.isArray(value)) {
          evalCons.push(`${String(value[0])} = '${String(value[1])}'`);
        }
        break;

      case 'isGreaterThan':
        if (Array.isArray(value)) {
          evalCons.push(`${String(value[0])} > '${String(value[1])}'`);
        }
        break;

      case 'isLessThan':
        if (Array.isArray(value)) {
          evalCons.push(`${String(value[0])} < '${String(value[1])}'`);
        }
        break;

      case 'isLike':
        if (Array.isArray(value)) {
          evalCons.push(`${String(value[0])} ilike('%${String(value[1])}%')`);
        }
        break;

      case 'range':
        if (Array.isArray(value) && typeof value[0] === 'number' && typeof value[1] === 'number') {
          evalCons.push('ORDER BY id');
          evalCons.push(`LIMIT ${String(value[1] - value[0] + 2)} OFFSET ${String(value[0])}`);
        }
        break;

      default:
        evalCons.push(`${key} = '${String(value)}'`);
        if (k + 1 < keys.length) evalCons.push(',');
        break;
    }

    if (operand) {
      evalCons.push(operand);
    }
  }

  return evalCons.join(' ');
}

function createQuery(
  tablename: string,
  cons: Constraint | undefined,
  cols: string[] | '*' | Record<string, unknown> | null,
  operation: 'select' | 'update' | 'delete'
): string {
  let query = '';

  switch (operation) {
    case 'select':
      query += `SELECT `;
      query += cols === '*' ? cols : (cols as string[]).join(', ');
      query += ` FROM ${tablename} `;

      if (cons) {
        query += `WHERE ${createSqlCons(cons)}`;
      }

      return query;

    case 'update':
      query += `UPDATE ${tablename} SET `;
      query += createSqlCons(cols as Constraint);
      if (cons) {
        query += ` WHERE ${createSqlCons(cons)}`;
      }
      return query;

    case 'delete':
      query += `DELETE FROM ${tablename} `;
      if (cons) {
        query += `WHERE ${createSqlCons(cons)}`;
      }
      return query;
  }
}

function debug(e: unknown, query: string): never {
  const error = e as { code?: string; message?: string; position?: string; hint?: string };
  throw {
    query: query,
    code: error.code,
    message: error.message,
    position: error.position,
    hint: error.hint,
  } as ErrorDebug;
}

export function dbConn() {
  return {
    from: (tablename: string) => {
      return {
        cons: (cons?: Constraint) => {
          return {
            select: async (cols: string[] | '*'): Promise<unknown[]> => {
              const query = createQuery(tablename, cons, cols, 'select');
              console.log(query);
              try {
                return await new Database(
                  new CreatePool('postgres', 'localhost', 'postgres', '1234')
                ).select(query);
              } catch (e) {
                return debug(e, query);
              }
            },

            update: async (changes: Record<string, unknown>): Promise<void> => {
              const query = createQuery(tablename, cons, changes, 'update');
              try {
                return await new Database(
                  new CreatePool('postgres', 'localhost', 'postgres', '1234')
                ).update(query);
              } catch (e) {
                return debug(e, query);
              }
            },

            delete: async (): Promise<void> => {
              const query = createQuery(tablename, cons, null, 'delete');
              try {
                return await new Database(
                  new CreatePool('postgres', 'localhost', 'postgres', '1234')
                ).delete(query);
              } catch (e) {
                return debug(e, query);
              }
            },

            insert: async (newRow: Record<string, unknown>): Promise<void> => {
              let query = `INSERT INTO ${tablename} (`;
              query += `${Array.from(Object.keys(newRow)).join(', ')}) `;
              query += `VALUES ('${Array.from(Object.values(newRow)).join("', '")}')`;

              try {
                return await new Database(
                  new CreatePool('postgres', 'localhost', 'postgres', '1234')
                ).insert(query);
              } catch (e) {
                return debug(e, query);
              }
            },
          };
        },
      };
    },
  };
}
