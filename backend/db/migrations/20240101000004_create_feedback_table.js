/**
 * Create feedback table
 * Stores user feedback for incorrect classifications
 */
exports.up = function (knex) {
  return knex.schema.createTable('feedback', (table) => {
    table.increments('id').primary();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.integer('prediction_id').unsigned().nullable();
    table.string('original_label', 100).notNullable();
    table.string('correct_label', 100).notNullable();
    table.float('confidence').nullable();
    table.string('city', 100).notNullable();
    table.text('notes').nullable();
    table.string('user_email', 255).nullable();
    table.boolean('resolved').defaultTo(false);
    
    table.foreign('prediction_id').references('predictions.id').onDelete('SET NULL');
    table.index('city');
    table.index('resolved');
    table.index('created_at');
    table.index('prediction_id');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('feedback');
};
