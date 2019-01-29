'use strict';

module.exports = {
    method: 'get',
    path: '/random-quotation',
    options: {
      handler: (request) => {

          const quotations = [
              {
                  quotation: 'I would rather fish any day than go to heaven.',
                  saidBy: 'Cornelia "Fly Rod" Crosby'
              },
              {
                  quotation: 'I want a turkey nut yogurt cane!',
                  saidBy: 'Stimpy'
              },
              {
                  quotation: 'Streams make programming in node simple, elegant, and composable.',
                  saidBy: 'substack'
              }
          ];

          const randomIndex = Math.floor(Math.random() * quotations.length);

          return quotations[randomIndex];
      }
    }
};
