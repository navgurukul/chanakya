exports.up = async (knex, Promise) => {
    // await knex.schema.createTable('main.subStage', (table) => {
    //   table.increments('id');
    //   table.integer('school_id');
    //   table.integer('stage_id');
    //   // table.integer('stage_id').references('id').inTable('main.school_stage');
    //   table.string('stage_name');
    //   table.string('sub_stages');
    //   // table.integer('sub_stages_id');
    // });
  };
  
  exports.down = async (knex, Promise) => {
    // await knex.schema.dropTable('main.subStage');
  };