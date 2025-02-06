const Airtable = require('airtable');

exports.handler = async function(context, event, callback) {
  const airtable = new Airtable({ apiKey: context.AIRTABLE_API_KEY });
  const base = airtable.base(context.AIRTABLE_BASE_ID);

  try {
    const { city, name, zip_code } = event;
    let filterFormula = '';
    
    // Build filter formula based on provided parameters
    const filters = [];
    if (city) {
      filters.push(`LOWER({city}) = LOWER("${city}")`);
    }
    if (name) {
      filters.push(`LOWER({name}) = LOWER("${name}")`);
    }
    if (zip_code) {
      filters.push(`{zip_code} = "${zip_code}"`);
    }
    
    // Combine filters with AND if multiple filters exist
    filterFormula = filters.length > 0 ? `AND(${filters.join(',')})` : '';

    const records = await base('venues').select({
      filterByFormula: filterFormula
    }).all();

    const venues = records.map(record => ({
      id: record.get('id'),
      name: record.get('name'),
      description: record.get('description'),
      city: record.get('city'),
      zip_code: record.get('zip_code'),
      venueFoodOptions: record.get('venue_food'),
      offVenueFoodOptions: record.get('off_venue_food'),
      venueDrinks: record.get('venue_drinks'),
      offVenueDrinks: record.get('off_venue_drinks')
    }));

    return callback(null, {
      success: true,
      venues: venues
    });

  } catch (error) {
    console.error('Error looking up venues:', error);
    return callback(null, {
      success: false,
      error: 'Failed to lookup venues',
      details: error.message
    });
  }
}; 