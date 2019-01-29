'use strict';

module.exports = [
  {
    method: 'get',
    path: '/hello/xyz',
    options: {
        handler: async (request, h) => {
          return {'helo': 12}
        },
        tags: ['api', 'hello'],
    }
  }
]
