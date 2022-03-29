exports.up = async (knex) => {
    await knex.schema.createTable("main.chanakya_roles", (table) => {
      table.increments();
      table.string("email").unique().notNullable();
      table.specificType("roles", "TEXT[]");
      table.specificType("privilege", "TEXT[]");
    });
  };
  
  exports.down = async (knex) => {
    await knex.schema.dropTable("main.chanakya_roles");
  };
  