const path = require('path');

const dbPath = process.env.DB_PATH || './db/ecosort.sqlite';

module.exports = {
  development: {
    client: 'better-sqlite3',
    connection: {
      filename: path.resolve(dbPath),
    },
    useNullAsDefault: true,
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './db/seeds',
    },
    pool: {
      afterCreate: (conn, cb) => {
        // Enable WAL mode for better concurrency
        conn.pragma('journal_mode = WAL');
        cb();
      },
    },
  },

  production: {
    client: 'better-sqlite3',
    connection: {
      filename: path.resolve(dbPath),
    },
    useNullAsDefault: true,
    migrations: {
      directory: './db/migrations',
      tableName: 'knex_migrations',
    },
    seeds: {
      directory: './db/seeds',
    },
    pool: {
      afterCreate: (conn, cb) => {
        conn.pragma('journal_mode = WAL');
        cb();
      },
    },
  },
};
