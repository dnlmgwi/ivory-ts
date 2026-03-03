# 🐘 Ivory

A PostgreSQL CRUD wrapper library that provides a fluent JavaScript/TypeScript API for SQL operations.

[![npm version](https://badge.fury.io/js/ivory-orm.svg)](https://www.npmjs.com/package/ivory-orm)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🚀 Write queries using JavaScript syntax without manual SQL strings
- 🛠️ Perform CRUD operations with complex multi-conditioned queries
- 📋 Create query templates for heterogeneous transactions
- 🔍 Better error handling with debug-friendly information
- ⚡ Pure SQL performance with a friendly interface
- 💪 Full TypeScript support with type safety

> **Note:** Designed for PostgreSQL only. 🐘

## Installation

```bash
npm install ivory-orm pg
```

## Quick Start

### JavaScript

```javascript
import { CreatePool, Database } from 'ivory-orm';

// Initialize connection
const pool = new CreatePool('postgres', 'localhost', 'postgres', 'password');
const conn = new Database(pool);

// Query
const cars = await conn
  .from('cars')
  .cons({ isEqualTo: ['id', 1] })
  .select(['id', 'name', 'model']);
```

### TypeScript

```typescript
import { CreatePool, Database } from 'ivory-orm';

interface Car {
  id: number;
  name: string;
  model: string;
  year: number;
}

const pool = new CreatePool('postgres', 'localhost', 'postgres', 'password');
const conn = new Database(pool);

const cars = await conn
  .from<Car>('cars')
  .cons({ isEqualTo: ['id', 1] })
  .select(['id', 'name', 'model']);
```

## API Reference

### Connection Setup

```javascript
import { CreatePool, Database } from 'ivory-orm';

const pool = new CreatePool(user, host, database, password);
const conn = new Database(pool);
```

### Query Pattern

Every query follows this pattern:

```javascript
conn.from(tableName).cons(conditions).operation(params);
```

### Conditions

Conditions define the `WHERE` clause:

```javascript
.cons({
  isEqualTo: ['column', value, 'AND'],
  isGreaterThan: ['column', value, 'OR'],
  isLessThan: ['column', value],
  isLike: ['column', 'searchTerm'],
  range: [0, 10]  // LIMIT/OFFSET pagination
})
```

**Available operators:**

- `isEqualTo` → `=`
- `isGreaterThan` → `>`
- `isLessThan` → `<`
- `isLike` → `ilike` (case-insensitive)
- `range` → `LIMIT/OFFSET`

### Operations

#### SELECT

```javascript
const results = await conn
  .from('cars')
  .cons({ isEqualTo: ['id', 1] })
  .select(['id', 'name', 'model']);

// Select all columns
const all = await conn
  .from('cars')
  .cons({ isGreaterThan: ['year', 2020] })
  .select('*');
```

#### INSERT

```javascript
await conn.from('cars').cons({}).insert({
  name: 'Mazda',
  year: 2017,
  model: 'CX-5',
});
```

#### UPDATE

```javascript
await conn
  .from('cars')
  .cons({ isEqualTo: ['id', 3] })
  .update({
    model: 'KG55',
    name: 'AS',
  });
```

#### DELETE

```javascript
await conn
  .from('cars')
  .cons({ isEqualTo: ['id', 3] })
  .delete();
```

### Complex Queries

```javascript
// Multiple conditions with operators
const results = await conn
  .from('cars')
  .cons({
    isEqualTo: ['brand', 'Toyota', 'OR'],
    isGreaterThan: ['year', 2015, 'AND'],
    isLike: ['model', 'Camry'],
  })
  .select(['id', 'name', 'year']);

// Pagination
const page = await conn
  .from('cars')
  .cons({
    isGreaterThan: ['year', 2010],
    range: [0, 10], // First 10 results
  })
  .select('*');
```

## TypeScript Support

Ivory includes full TypeScript definitions. Use generics for type-safe results:

```typescript
interface User {
  id: number;
  email: string;
  name: string;
}

const users = await conn
  .from<User>('users')
  .cons({ isEqualTo: ['active', true] })
  .select(['id', 'email', 'name']);
// users is typed as User[]
```

## Error Handling

Ivory provides enhanced error messages with query context:

```javascript
try {
  await conn.from('cars').cons({ id: 999 }).delete();
} catch (error) {
  console.log(error.query); // The SQL query that failed
  console.log(error.code); // PostgreSQL error code
  console.log(error.message); // Error message
  console.log(error.hint); // PostgreSQL hint
}
```

## Requirements

- Node.js >= 18.0.0
- PostgreSQL database
- `pg` package (peer dependency)

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## Found a Bug?

Please create an issue on [GitHub](https://github.com/yourusername/ivory-orm/issues).
