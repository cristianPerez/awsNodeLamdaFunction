'use strict';

const aws = require('aws-sdk');
const { mapSeries } = require('async');
const { log, error } = console;
const { productsSchema, importStatusSchema } = require('./schema');
const uuidv1 = require('uuid/v1');

const dynamoInstance = new aws.DynamoDB();

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

const saveRow = (row, table, callback) => {

    try {

        aws.config.update({
            region: process.env.AWS_REGION,
            endpoint: process.env.DYNAMO_URL
        });

        const docClient = new aws.DynamoDB.DocumentClient();

        docClient.put({

            TableName: table,
            Item: row

        }, (err, data) => {

            if (err) {

                log('Error while saving the row %s', err.message);
                return callback(err, null);

            }

            return callback(null, data);

        });

    } catch (err) {

        error('Error creating dataTable %s', err.message);
        return callback(err, null);

    }

};

const saveInfoProcess = (tableImportProcess, uuid, callback) => {

    try {

        createTable(tableImportProcess, importStatusSchema, (err, data) => {

            if (err) {

                error('Erro creating table process on dymano %s', err.message);
                return callback(err, null);

            }

            log(`Creating table in process waiting for the table exist: ${data}`);
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

const saveData = (table, body, callback) => {

    try {

        createTable(table, productsSchema, (err, data) => {

            if (err) {

                error('Eror creating a products table on dynamo %s', err.message);
                return callback(err, null);

            }
            log(`Create table succesfull: ${data}`);
            dynamoInstance.waitFor('tableExists', {
                TableName: table
            }, (err, data) => {

                if (err) {

                    error('Error waiting for the table creation: %s', err.message);
                    return callback(err, null);

                }
                log(`The table was already created ${data}`);
                let errorsArray = [];
                let { rows, uuid } = body;

                mapSeries(rows, (item, callbackMapSeries) => {

                    item.sequence = uuidv1();

                    saveRow(item, table, (err, data) => {

                        if (err) {

                            error(`Error saving the row: %s ${item}`, err.message);
                            errorsArray.push({ item: JSON.stringify(item), err });

                        }

                        log('Row added correctly: sequence %s', item.sequence);
                        return callbackMapSeries(null, data);

                    });

                }, (err, data) => {

                    if (err) {

                        error('Error saving the data in dynamoDB %s', err.message);
                        return callback(err, null);

                    }
                    /**UPDATE THE TABLE PROCESS ON DYNAMODB */
                    /**SPACE FOR UPDATE ERRORS IN A TABLE DYNAMODB */
                    if (uuid !== null && uuid !== undefined) {

                        const tableImportStatus = `products-process-${process.env.CUSTOMER_NAME}-${uuid}`;
                        saveInfoProcess(tableImportStatus, table, uuid, (err, data) => {

                            if (err) {

                                error(`Problems updating the process: ${err.message}`);

                            }
                            log(`Process updated successfully ${data}`);

                        });

                    }

                    log('Batch process finish done:', data.length);
                    const notification = {
                        status: errorsArray.length > 0 ? 'finish_with_errors' : 'finished',
                        doneProcess: data.length - errorsArray.length,
                        numberErrors: errorsArray.length,
                        errors: errorsArray
                    };
                    return callback(null, notification);

                });

            });

        });

    } catch (err) {

        error('Error save data', err);
        return callback(err, null);

    }

};

module.exports = {
    saveData,
    saveInfoProcess
};
