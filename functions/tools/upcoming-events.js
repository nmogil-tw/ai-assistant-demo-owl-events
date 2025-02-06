const Airtable = require('airtable');

exports.handler = async function (context, event, callback) {
  try {
    // Validate Airtable configuration
    if (!context.AIRTABLE_API_KEY || !context.AIRTABLE_BASE_ID) {
      return callback(null, {
        status: 500,
        message: 'Airtable configuration error. Please check environment variables.',
      });
    }

    // Validate venue name from payload
    const venue_name = event.venue_name;
    if (!venue_name) {
      return callback(null, {
        status: 400,
        message: 'Venue name is required',
      });
    }

    // Airtable setup
    const base = new Airtable({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);

    console.log(`Querying events for venue: ${venue_name}`);

    // Query events from Airtable with venue filter
    const records = await base('products')
      .select({
        filterByFormula: `{venue_name} = '${venue_name}'`,
        sort: [{ field: 'event_date', direction: 'asc' }]
      })
      .all();

    if (!records || records.length === 0) {
      console.log(`No events found for venue: ${venue_name}`);
      return callback(null, {
        status: 404,
        message: `No events found for venue: ${venue_name}`,
      });
    }

    console.log(`Found ${records.length} events for ${venue_name}`);
    return callback(null, {
      status: 200,
      events: records.map(record => record.fields),
    });

  } catch (err) {
    console.error('Unexpected error:', err.message);
    return callback(null, {
      status: 500,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
};