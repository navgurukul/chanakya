exports.up = async (knex) => {
  // await knex.schema.table('main.feedbacks', (table) => {
  //   table.text('notification_sent_at');
  //   table.text('notification_status');
  // });
};

exports.down = async (knex, Promise) => {
  // await knex.schema.table('main.feedbacks');
};
