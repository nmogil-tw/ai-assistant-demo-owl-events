/**
 * List of tools to be attached to the assistant
 * @param {string} domain
 * @returns
 */
module.exports = (domain) => ({
  customerLookup: {
    name: 'Customer Lookup',
    description:
      'Use this tool at the beginning of every conversation to learn about the customer.\n\nTool Rules:\n - Mandatory at conversation start\n - Accessible fields: first name, last name, address, email, phone\n - Use to personalize greeting',
    type: 'WEBHOOK',
    method: 'GET',
    url: `https://${domain}/tools/customer-lookup`,
  },
  ticketLookup: {
    name: 'Ticket Look Up',
    description:
      'Use this tool to look up the customer\'s ticket. ALWAYS ask the user to confirm the last four characters of their ticket number to ensure you are referencing the correct one.',
    type: 'WEBHOOK',
    method: 'GET',
    url: `https://${domain}/tools/ticket-lookup`,
    schema: {
      order_confirmation_digits: 'string', //the last four characters of the ticket number
    },
  },
  returnOrder: {
    name: 'Return Ticket',
    description:
      'Use this tool to process a ticket return using the ticket ID. Collect the reason for return from the customer before proceeding.',
    type: 'WEBHOOK',
    method: 'POST',
    url: `https://${domain}/tools/return-order`,
    schema: {
      order_id: 'string', //the ticket id to return
      return_reason: 'string', //why the customer is returning the ticket
    },
  },
  customerSurvey: {
    name: 'Customer Survey',
    description:
      'Use this tool when you have conducted the customer survey after you have handled all the users questions and requests. ALWAYS use this tool before ending the conversation.',
    type: 'WEBHOOK',
    method: 'POST',
    url: `https://${domain}/tools/create-survey`,
    schema: {
      rating: 'number', //the rating the user gave 1-5
      feedback: 'string', //the feedback the user gave
    },
  },
  upcomingEvents: {
    name: 'Upcoming Events',
    description:
      'Use this tool to look up upcoming events at a specific venue. You must provide the venue name.',
    type: 'WEBHOOK',
    method: 'GET',
    url: `https://${domain}/tools/upcoming-events`,
    schema: {
      venue_name: 'string', // the name of the venue to query events for
    },
  },
  sendToFelx: {
    name: 'Send to Flex',
    description:
      'Use this tool when the user wants to speak with a supervisor or when you are not able to fulfill their request. ALWAYS tell the user you are transferring them to a Supervisor before using this tool.',
    type: 'WEBHOOK',
    method: 'GET',
    url: `https://${domain}/tools/send-to-flex`,
  },
  placeOrder: {
    name: 'Place Ticket Order',
    description:
      "Use this tool to place a ticket order for an event. ALWAYS confirm the event details (name, venue, date, price) with the user before placing the order. Check ticket availability before proceeding.",
    type: 'WEBHOOK',
    method: 'POST',
    url: `https://${domain}/tools/place-order`,
    schema: {
      event_id: 'string',
    },
  },
  venueLookup: {
    name: 'Venue Lookup',
    description:
      'Use this tool to search for venue information based on city, venue name, or zip code. Returns detailed information about matching venues including food and drink options.',
    type: 'WEBHOOK',
    method: 'GET',
    url: `https://${domain}/tools/venue-lookup`,
    schema: {
      city: 'string', // optional: city to search for
      name: 'string', // optional: venue name to search for
      zipCode: 'string', // optional: zip code to search for
    },
  },
});
