const _ = require('underscore');

exports.up = async (knex) => {
  await knex.schema.table('contacts', (table) => {
    table.string('contact_type').after('isWhatsapp').nullable()
  });
    
  await knex.select('*').from('contacts')
    .then((contacts) => {
      const promises = [];
      _.each(contacts, (contact) => {
        if(contact.isWhatsapp) {
          const promise = knex('contacts').update({
            contact_type: "whatsapp"
          }).where('studentId', contact.studentId).andWhere("isWhatsapp", true)
          promises.push(promise)
        } else {
          const promise = knex('contacts').update({
            contact_type: "primary"
          }).where('studentId', contact.studentId).andWhere("isWhatsapp", false)
          promises.push(promise)
        }
      })
      return Promise.all(promises);
    })
};

exports.down = async (knex) => {
  await knex.schema.table('contacts', (table) => {
    table.dropColumn('contact_type');
  });
};
