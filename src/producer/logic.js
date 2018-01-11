/**
 * Logic module.
 * @module logic
 */

'use strict';

const uuidv1 = require('uuid/v1');

const sqsHelper = require('../helpers/sqs');
const { getS3Data } = require('../helpers/s3');
const { saveInfoProcess } = require('../helpers/dynamodb');
const { log, error } = console;
const urlQueue = process.env.AWS_QUEUE_URL;
const tableName = `import-process-${process.env.CUSTOMER_NAME}`;

/**
 * Create a sqs id it doesn't exist after import data from s3 csv file and send the messages to the sqs.
 * @param {parameter} body - Request body.
 * @param {parameter} callback - return the process.
 */

exports.importData = (body, callback) => {

    try {

        const uuidProcess = uuidv1();
        log(`Ready for send messages to ::: ${urlQueue}`);

        getS3Data(body, urlQueue, (err, data) => {

            if (err) {

                error('Error parsing the data from csv file %s', err);
                return callback(err, null);

            }
            let metaData = data;
            log(`METADATA :: ${metaData.messages.length}`);

            saveInfoProcess(tableName, uuidProcess, (err, data) => {

                if (err) {

                    error('Error saving info process on dynamo %s', err.message);
                    return callback(err, null);

                }
                log(`The table was created successful : ${data}`);

                sqsHelper.sendBatch(uuidProcess, metaData.messages, urlQueue, (err, data) => {

                    if (err) {

                        error('Error sending messages to sqs %s', err.message);
                        return callback(err, null);

                    }
                    metaData.messages = {
                        successful: data.rightMessage.length,
                        failed: data.errorsMessages.length
                    };
                    return callback(null, metaData);

                });

            });

        });

    } catch (err) {

        error('Error getting file %s', err.message);
        return callback(err, null);

    }

};
