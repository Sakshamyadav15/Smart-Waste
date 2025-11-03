/**
 * Create predictions table
 * Stores AI classification predictions with metadata
 */
exports.up = function (knex) {
  return knex.schema.createTable('predictions', (table) => {
    table.increments('id').primary();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.integer('city_id').unsigned().notNullable();
    table.string('user_id', 100).nullable();
    table.string('image_path', 500).notNullable();
    table.string('audio_path', 500).nullable();
    table.string('predicted_label', 100).notNullable();
    table.float('confidence').notNullable();
    table.text('raw_model_response').nullable();
    table.string('applied_taxonomy', 200).nullable();
    table.string('model_version', 50).defaultTo('v1');
    table.boolean('has_feedback').defaultTo(false);
    table.integer('feedback_id').unsigned().nullable();
    
    table.foreign('city_id').references('cities.id').onDelete('CASCADE');
    table.index('city_id');
    table.index('predicted_label');
    table.index('created_at');
    table.index('has_feedback');
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists('predictions');
};
