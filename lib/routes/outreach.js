module.exports = [
  {
    method: 'GET',
    path: '/outreach/records',
    options: {
      description: 'Get statistical data of each outreach',
      tags: ['api'],
      auth: {
        strategy: 'jwt',
      },
      handler: async (request) => {
        const { outreachService } = request.services();
        return outreachService.getAllOutreachData();
      },
    },
  },
];
