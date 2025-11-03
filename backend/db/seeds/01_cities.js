/**
 * Seed cities with major Indian cities
 */
exports.seed = async function (knex) {
  // Delete existing entries
  await knex('cities').del();

  // Insert seed data
  await knex('cities').insert([
    { code: 'BLR', name: 'Bengaluru' },
    { code: 'DEL', name: 'Delhi' },
    { code: 'MUM', name: 'Mumbai' },
    { code: 'CHN', name: 'Chennai' },
    { code: 'KOL', name: 'Kolkata' },
    { code: 'HYD', name: 'Hyderabad' },
    { code: 'PNQ', name: 'Pune' },
    { code: 'AHM', name: 'Ahmedabad' },
  ]);
};
