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
        routes: {
            validate: {
              failAction: async (request, h, err) => {
                if (process.env.NODE_ENV === 'production') {
                  // In prod, log a limited error message and throw the default Bad Request error.
                  console.error('ValidationError:', err.message);
                  throw Boom.badRequest(`Invalid request payload input`);
                } else {
                  // During development, log and respond with the full error.
                  console.error(err);
                  throw err;
                }
              }
            }
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
                    },
                    incomingCallType: ['requestCallback'],
                    studentStages: [
                        'requestCallback',
                        'enrolmentKeyGenerated',
                        'stageXYZ',
                        'stageABC'
                    ]
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
