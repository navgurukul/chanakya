exports.up = async (knex, Promise) => {
  // await knex.schema.createTable('main.sub_stage', (table) => {
  //   table.increments('id');
  //   table.integer('school_id');
  //   table.integer('stage_id').references('id').inTable('main.school_stage');
  //   table.string('stage_name');
  //   table.string('sub_stages');
  // });
};

exports.down = async (knex, Promise) => {
  // await knex.schema.dropTable('main.sub_stage');
};
