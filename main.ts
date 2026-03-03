import { conn } from './lib/init.js';

await conn
  .from('cars')
  .cons({
    isEqualTo: ['id', 3],
  })
  .delete();
