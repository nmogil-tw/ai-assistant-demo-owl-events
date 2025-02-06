const Airtable = require('airtable');

exports.handler = async function(context, event, callback) {
  const response = new Twilio.Response();
  response.appendHeader('Content-Type', 'application/json');
  
  try {
    // Validate Airtable configuration
    if (!context.AIRTABLE_API_KEY || !context.AIRTABLE_BASE_ID) {
      response.setStatusCode(500);
      response.setBody({ error: 'Airtable configuration error. Please check environment variables.' });
      return callback(null, response);
    }

    const base = new Airtable({apiKey: context.AIRTABLE_API_KEY}).base(context.AIRTABLE_BASE_ID);

    // Extract and validate the x-identity header
    const identityHeader = event.request.headers["x-identity"];
    if (!identityHeader) {
      response.setStatusCode(400);
      response.setBody({ 
        error: 'Missing x-identity header. Provide email or phone in the format: "email:<email>" or "phone:<phone>".' 
      });
      return callback(null, response);
    }

    const { event_id } = event;
    if (!event_id) {
      response.setStatusCode(400);
      response.setBody({ error: 'Missing event_id in request body' });
      return callback(null, response);
    }

    // Parse identity header
    let queryField, queryValue;
    if (identityHeader.startsWith('email:')) {
      queryField = 'email';
      queryValue = identityHeader.replace('email:', '').trim();
    } else if (identityHeader.startsWith('phone:')) {
      queryField = 'phone';
      queryValue = identityHeader.replace('phone:', '').trim();
    } else if (identityHeader.startsWith('whatsapp:')) {
      queryField = 'phone';
      queryValue = identityHeader.replace('whatsapp:', '').trim();
    } else {
      response.setStatusCode(400);
      response.setBody({ 
        error: 'Invalid x-identity format. Use "email:<email>" or "phone:<phone>".' 
      });
      return callback(null, response);
    }

    // Lookup customer
    const customerRecords = await base('customers')
      .select({
        filterByFormula: `{${queryField}} = '${queryValue}'`,
        maxRecords: 1
      })
      .firstPage();

    if (!customerRecords || customerRecords.length === 0) {
      response.setStatusCode(404);
      response.setBody({ error: `No customer found for ${queryField}: ${queryValue}` });
      return callback(null, response);
    }

    const customer = customerRecords[0].fields;

    // Lookup event instead of product
    const eventRecords = await base('upcoming_events')
      .select({
        filterByFormula: `{id} = '${event_id}'`,
        maxRecords: 1
      })
      .firstPage();

    if (!eventRecords || eventRecords.length === 0) {
      response.setStatusCode(404);
      response.setBody({ error: `No event found with id: ${event_id}` });
      return callback(null, response);
    }

    const eventDetails = eventRecords[0].fields;
    
    // Add debug logging
    console.log('Event details:', JSON.stringify(eventDetails));
    console.log('Ticket price type:', typeof eventDetails.ticket_price);

    // Check ticket availability
    if (eventDetails.tickets_available <= 0) {
      response.setStatusCode(400);
      response.setBody({ error: 'Event is sold out' });
      return callback(null, response);
    }

    // Parse ticket price with more robust handling
    let ticketPrice;
    if (typeof eventDetails.ticket_price === 'string') {
      ticketPrice = parseFloat(eventDetails.ticket_price.replace('$', ''));
    } else if (typeof eventDetails.ticket_price === 'number') {
      ticketPrice = eventDetails.ticket_price;
    } else {
      response.setStatusCode(500);
      response.setBody({ error: 'Invalid ticket price format' });
      return callback(null, response);
    }

    if (isNaN(ticketPrice)) {
      response.setStatusCode(500);
      response.setBody({ error: 'Could not parse ticket price' });
      return callback(null, response);
    }

    // Generate random 6-digit ticket ID
    const ticketId = Math.floor(100000 + Math.random() * 900000).toString();

    // Create ticket record
    const ticketData = {
      id: ticketId,
      customer_id: customer.id,
      email: customer.email,
      phone: customer.phone,
      venue: eventDetails.venue_name,
      event: eventDetails.event_name,
      total_amount: ticketPrice,
      created_at: new Date().toISOString()
    };

    const newTicket = await base('tickets').create([
      { fields: ticketData }
    ]);

    if (!newTicket || newTicket.length === 0) {
      response.setStatusCode(500);
      response.setBody({ error: 'Failed to create ticket record' });
      return callback(null, response);
    }

    // Update tickets_available count
    await base('upcoming_events').update([{
      id: eventRecords[0].id,
      fields: {
        tickets_available: eventDetails.tickets_available - 1
      }
    }]);

    // Return success response
    response.setStatusCode(200);
    response.setBody({
      message: 'Ticket ordered successfully',
      ticket_id: ticketId,
      order_details: {
        customer: {
          name: `${customer.first_name} ${customer.last_name}`,
          email: customer.email
        },
        event: {
          name: eventDetails.event_name,
          venue: eventDetails.venue_name,
          date: eventDetails.event_date,
          price: ticketPrice,
          description: eventDetails.event_description
        }
      }
    });

    return callback(null, response);

  } catch (error) {
    console.error('Unexpected error:', error);
    response.setStatusCode(500);
    response.setBody({ error: 'Internal server error' });
    return callback(null, response);
  }
};