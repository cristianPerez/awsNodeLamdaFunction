'use strict';

const aws = require('aws-sdk');

const { log, error } = console;
const { importSChema } = require('./schema');
const tableErrorsName = `import-errors-${process.env.CUSTOMER_NAME}`;

const dynamoInstance = new aws.DynamoDB();

/**
 * Method for create a table in dynamoDB.
 * @param {parameter} tableName - Name of the table that is going to be created.
 * @param {parameter} schema - structure for validate de schema.
 * @param {parameter} callback - return the callback process.
 */
const createTable = (tableName, schema, callback) => {

    try {

        schema.TableName = tableName;
        dynamoInstance.createTable(schema, (err, data) => {

            if (err) {

                if (err.code === 'ResourceInUseException') {

                    return callback(null, data);

                } else {

                    error('Error creating the table: %s', err.message);
                    return callback(err, null);

                }

            }

            return callback(null, data);

        });

    } catch (err) {

        error('Error creating the table: %s', err.message);
        return callback(err, null);

    }

};

/**
 * Method save the first information of the process on dynamoDB.
 * @param {parameter} tableImportProcess - Name of the table where the information is going to be saved.
 * @param {parameter} uuid - id of process.
 * @param {parameter} callback - return the callback process.
 */
const saveInfoProcess = (tableImportProcess, uuid, callback) => {

    try {

        createTable(tableImportProcess, importSChema, (err, data) => {

            if (err) {

                error('Erro creating table process on dymano %s', err.message);
                return callback(err, null);

            }

            log(`Creating table in process waiting for the table exist: ${data}`);

            createTable(tableErrorsName, importSChema, (err, data) => {

                if (err) {

                    error(`Error creating a table errors: ${err.message}`);

                }
                log(`Table errors was created ${data}`);

            });

            dynamoInstance.waitFor('tableExists', {
                TableName: tableImportProcess
            }, (err, data) => {

                if (err) {

                    error('Error waiting for the table creation: %s', err.message);
                    return callback(err, null);

                }

                log(`Table ${tableImportProcess} created : ${data}`);

                const docClient = new aws.DynamoDB.DocumentClient();
                const infoProcess = {
                    uuid,
                    status: 'Processing',
                    doneprocess: 0,
                    numbererrors: 0,
                    errors: [],
                    lastupdate: Date.now()
                };

                docClient.put({

                    TableName: tableImportProcess,
                    Item: infoProcess

                }, (err, data) => {

                    if (err) {

                        log('Error saving the process info %s', err.message);
                        return callback(err, null);

                    }

                    return callback(null, data);

                });

            });

        });

    } catch (err) {

        error('Error saving info', err);
        return callback(err, null);

    }

};

module.exports = {
    saveInfoProcess
};
