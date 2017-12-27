/**
 * Producer Module
 * @module producer
 */

'use strict';

/**
 * Log for errors.
 */
const { error, log } = console;
const { importData } = require('./logic');

const Bucket = process.env.AWS_S3_BUCKET;

/**
 * Function that will be used in the serverless file and will be send as a lambda function,
 * which will use the "logic" this function is using for read and proces one CSV file hosted on S3.
 * @param {parameter} event - AWS uses to pass in event data to the handler.
 * @param {parameter} context - Provide your handler the runtime information of the Lambda function that is executing.
 * @param {parameter} callback - Return information to the caller, otherwise return value is null.
 */

module.exports.producer = (event, context, callback) => {

    try {

        const body = {
            Bucket,
            Key: event.key
        };
        importData(body, (err, data) => {

            if (err) {

                error('There is an error reading the data: %s', err.message);
                return callback(err, null);

            }
            log('Answer: ', data);
            return callback(null, data);

        });

    } catch (err) {

        error('There is an error: %s', err);
        return callback(err, null);

    }

};
