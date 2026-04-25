import * as fs from 'fs';
import * as path from 'path';

const dbPath = path.resolve(__dirname, '..', 'prisma', 'dev.db');
const extraPaths = [`${dbPath}-journal`, `${dbPath}-shm`, `${dbPath}-wal`];

for (const filePath of [dbPath, ...extraPaths]) {
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

console.log('SQLite database reset.');
