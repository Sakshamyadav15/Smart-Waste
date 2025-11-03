/**
 * Seed taxonomy mappings for common waste categories
 * Maps model labels to city-specific actions
 */
exports.seed = async function (knex) {
  // Delete existing entries
  await knex('taxonomy_mappings').del();

  // Get city IDs
  const bengaluru = await knex('cities').where({ code: 'BLR' }).first();
  const delhi = await knex('cities').where({ code: 'DEL' }).first();
  const mumbai = await knex('cities').where({ code: 'MUM' }).first();
  const chennai = await knex('cities').where({ code: 'CHN' }).first();

  // Common waste categories and their actions
  const commonMappings = [
    {
      model_label: 'plastic',
      canonical_label: 'Plastic',
      action_text: 'Rinse and Recycle – Blue Bin',
    },
    {
      model_label: 'film',
      canonical_label: 'Plastic Film/Wrapper',
      action_text: 'Landfill – Red Bin',
    },
    {
      model_label: 'organic',
      canonical_label: 'Organic Waste',
      action_text: 'Compost – Green Bin',
    },
    {
      model_label: 'paper',
      canonical_label: 'Paper',
      action_text: 'Recycle – Blue Bin',
    },
    {
      model_label: 'cardboard',
      canonical_label: 'Cardboard',
      action_text: 'Flatten and Recycle – Blue Bin',
    },
    {
      model_label: 'metal',
      canonical_label: 'Metal',
      action_text: 'Rinse and Recycle – Blue Bin',
    },
    {
      model_label: 'glass',
      canonical_label: 'Glass',
      action_text: 'Rinse and Recycle – Blue Bin',
    },
    {
      model_label: 'sanitary',
      canonical_label: 'Sanitary Waste',
      action_text: 'Hazardous Waste Bag – Special Collection',
    },
    {
      model_label: 'e_waste',
      canonical_label: 'Electronic Waste',
      action_text: 'E-waste Collection Point',
    },
    {
      model_label: 'battery',
      canonical_label: 'Battery',
      action_text: 'Hazardous Waste Collection Point',
    },
    {
      model_label: 'textile',
      canonical_label: 'Textile',
      action_text: 'Donate or Textile Recycling Bin',
    },
    {
      model_label: 'tetra_pack',
      canonical_label: 'Tetra Pack',
      action_text: 'Rinse and Recycle – Blue Bin',
    },
  ];

  const mappings = [];

  // Add mappings for each city
  [bengaluru, delhi, mumbai, chennai].forEach((city) => {
    if (city) {
      commonMappings.forEach((mapping) => {
        mappings.push({
          city_id: city.id,
          model_label: mapping.model_label,
          canonical_label: mapping.canonical_label,
          action_text: mapping.action_text,
        });
      });
    }
  });

  // Insert all mappings
  await knex('taxonomy_mappings').insert(mappings);
};
