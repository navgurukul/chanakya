const logger = require('../../server/logger');

module.exports = [
  {
    method: 'GET',
    path: '/outreach/records',
    options: {
      description: 'Get statistical data of each outreach',
      tags: ['api'],
      handler: async (request) => {
        const { outreachService } = request.services();
        logger.info('Get statistical data of each outreach');
        return outreachService.getAllOutreachData();
      },
    },
  },
];
