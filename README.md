# Chanakya

## How to run the Project?

1. `npm install` to install the dependencies
2. Set up the DB in MySQL. Read the `How to use Knex Migrations?` section.
3. Create a .env file in the root directory of the project and update the required variables. You can use `sample.env` as the skeleton.
4. `npm start` to run the server. The server will run with auto reloading using nodemon.

## How to use Knex Migrations?

The initial schema created while developing Chanakya is not created as a Knex schema but stored in a SQL file in `sqlScripts/initialSchema.sql`. When you are installing Chanakya for the first time you need to first import this schema into the MySQL DB.

After importing the schema you can run the migrations using `knex migrate:latest`.

*Note: Check `Import Schema` section under `Important Commands` to see how to import the initialSchema.sql file into your DB.*

## Important Commands

### Export Schema of DB
`mysqldump -u root -p --no-data chanakya > schema.sql`

### Import Schema
`mysql -u username -p chanakya < sqlScripts/initialSchema.sql`

### Run server with Auto Reload
`npm start`
