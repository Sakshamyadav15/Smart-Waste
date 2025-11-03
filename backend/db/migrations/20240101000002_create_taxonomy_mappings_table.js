/**
 * Create taxonomy_mappings table
 * Maps model labels to city-specific canonical labels and actions
 */
exports.up = function (knex) {
  return knex.schema.createTable('taxonomy_mappings', (table) => {
    table.increments('id').primary();
    table.integer('city_id').unsigned().notNullable();
    table.string('model_label', 100).notNullable();
    table.string('canonical_label', 100).notNullable();
    table.text('action_text').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    table.foreign('city_id').references('cities.id').onDelete('CASCADE');
    table.unique(['city_id', 'model_label']);
    table.index('city_id');
    table.index('model_label');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('taxonomy_mappings');
};
