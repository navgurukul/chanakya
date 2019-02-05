'use strict';

const Dotenv = require('dotenv');
const Confidence = require('confidence');
const Toys = require('toys');

// Pull .env into process.env
Dotenv.config({ path: `${__dirname}/.env` });

// Glue manifest as a confidence store
module.exports = new Confidence.Store({
    server: {
        host: 'localhost',
        port: {
            $filter: { $env: 'NODE_ENV' },
            $default: {
                $env: 'PORT',
                $coerce: 'number',
                $default: 3000
            },
            test: { $value: undefined }         // Let the server find an open port
        },
        debug: {
            $filter: { $env: 'NODE_ENV' },
            $default: {
                log: '*',
                request: '*'
            },
            production: {
                log: ['error'],
                request: ['error']
            }
        }
    },
    register: {
        plugins: [
            {
                plugin: '../lib', // Main plugin
                options: {
                    jwtKey: {
                        $filter: { $env: 'NODE_ENV' },
                        $default: {
                            $env: 'APP_SECRET',
                            $default: 'app-secret'
                        },
                        production: {           // In production do not default to "app-secret"
                            $env: 'APP_SECRET'
                        }
                    }
                }
            },
            {
                plugin: {
                    $filter: { $env: 'NODE_ENV' },
                    $default: 'hpal-debug',
                    production: Toys.noop
                }
            },
            {
                plugin: 'schwifty',
                options: {
                    $filter: { $env: 'NODE_ENV' },
                    $default: {},
                    $base: {
                        migrateOnStart: true,
                        knex: {
                            client: "mysql",
                            connection: {
                                database: "chanakya",
                                host: "127.0.0.1",
                                user: "root",
                                password: "learntolearn",
                                requestTimeout: 90000,
                                connectionTimeout: 30000,
                                acquireConnectionTimeout: 30000
                            },
                            pool: {
                                min: 4,
                                max: 10
                            }
                        }
                    },
                    production: {
                        migrateOnStart: false
                    }
                }
            },
            {
                plugin: './plugins/swagger'
            },
        ]
    }
});
