/**
 * Logic module.
 * @module logic
 */

'use strict';

const sqsHelper = require('../helpers/sqshelper');
const { getS3Data } = require('../helpers/s3helper');
const { log, error } = console;

/**
 * Create a sqs id it doesn't exist after import data from s3 csv file and send the messages to the sqs.
 * @param {parameter} body - Request body.
 * @param {parameter} callback - return the process.
 */

exports.importData = (body, callback) => {

    try {

        sqsHelper.createQueue(process.env.AWS_QUEUE_NAME, (err, data) => {

            if (err) {

                error('Error creating the SQS: %s', err.message);
                return callback(err, null);

            }

            let urlQueue = data.QueueUrl;
            log(`the SQS was created::: ${urlQueue}`);

            getS3Data(body, urlQueue, (err, data) => {

                if (err) {

                    error('Error parsing the data from csv file %s', err);
                    return callback(err, null);

                }
                let metaData = data;
                log(`METADATA :: ${metaData.messages.length}`);
                sqsHelper.sendBatch(metaData.messages, urlQueue, (err, data) => {

                    if (err) {

                        error('Error sending messages to sqs %s', err.message);
                        return callback(err, null);

                    }
                    metaData.messages = {
                        messagesRigth: data.rightMessage.length,
                        messagesWrong: data.errorsMessages.length
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
