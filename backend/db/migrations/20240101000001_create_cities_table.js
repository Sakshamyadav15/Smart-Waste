/**
 * Create cities table
 * Stores city information for waste management taxonomies
 */
exports.up = function (knex) {
  return knex.schema.createTable('cities', (table) => {
    table.increments('id').primary();
    table.string('code', 10).notNullable().unique();
    table.string('name', 100).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.index('code');
    table.index('name');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('cities');
};
