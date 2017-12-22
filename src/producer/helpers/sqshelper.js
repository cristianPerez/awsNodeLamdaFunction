'use strict';

const aws = require('aws-sdk');
const sqs = new aws.SQS();
const { mapSeries } = require('async');

const { log, error } = console;

const createQueue = function (nameQueue, callback) {

    try {

        const params = {
            QueueName: nameQueue,
            Attributes: {
                VisibilityTimeout: '60'
            }
        };

        sqs.createQueue(params, function (err, data) {

            if (err) {

                error('Error creating the SQS: %s', err.message);
                return callback(err, null);

            }
            log(`The queue was created: ${JSON.stringify(data)}`);
            return callback(null, data);

        });

    } catch (err) {

        error('Error creating the queue SQS %s', err.message);
        return callback(err, null);

    }

};

const sendMessage = function (messaje, queueUrl, callback) {

    try {

        var params = {
            MessageBody: messaje,
            QueueUrl: queueUrl,
            DelaySeconds: 0
        };

        sqs.sendMessage(params, function (err, data) {

            if (err) {

                error('Error sending a message: %s', err.message);
                /**
                 * What happen if the message hasn't sent.
                 */
                return callback(err, null);

            }
            callback(null, data);

        });

    } catch (err) {

        error('Error sending a message: %s', err.message);
        return callback(err, null);

    }

};

const sendBatch = function (messages, queueUrl, callback) {

    try {

        let rightMessage = [];
        let errorsMessages = [];
        mapSeries(messages, function (message, callbackMapSeries) {

            log(`sending message: ${message.email}`);
            sendMessage(JSON.stringify(message), queueUrl, function (err, data) {

                if (err) {

                    error('Error during sent the mesage: %s error: %s', message, err.message);
                    //return callback(err, null);
                    errorsMessages.push({ message, answer: data });

                }
                log('Message sent: %s', data);
                rightMessage.push({ message, answer: data });
                return callbackMapSeries(null, data);

            });

        }, function (err, data) {

            if (err) {

                error('Error sending a message: %s', err.message);
                return callback(err, null);

            }
            log('Final data from map Series: %s', data);
            return callback(null, {
                rightMessage,
                errorsMessages
            });

        });

    } catch (err) {

        error('Error during sent batch of mesagges: %s', err.message);
        return callback(err, null);

    }

};

module.exports = {
    createQueue,
    sendBatch
};
