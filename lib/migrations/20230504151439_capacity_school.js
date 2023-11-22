exports.up = async (knex) => {
    await knex.schema.alterTable('main.campus_school', (table) => {
      table.integer('capacityofschool');
    });
  };
  
  exports.down = async (knex) => {
    await knex.schema.alterTable('main.campus_school', (table) => {
      table.integer('capacityofschool');
    });
  };
  
