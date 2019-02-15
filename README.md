# Chanakya

## Important Commands

### Export Schema of DB
`mysqldump -u root -p --no-data chanakya > sqlScripts/schema.sql`

### Import Schema
`mysql -u username -p chanakya < schema.sql`

### Run server with Auto Reload
`npm start`
