'use strict';

const aws = require('aws-sdk');
const sqs = new aws.SQS();
const { whilst } = require('async');

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
        let page = 0;
        let nextPage = messages.length;

        whilst(function () {

            //return messages.length > 0;
            return page < nextPage;

        },
        function (next) {

            //let auxiliarArray = messages.splice(0, 100);
            let auxiliarArray = messages.slice(page, 100);

            sendMessage(JSON.stringify(auxiliarArray), queueUrl, function (err, data) {

                if (err) {

                    error('Error during sent the mesage: %s error: %s', auxiliarArray, err.message);
                    errorsMessages.push({ auxiliarArray, answer: data });

                }
                log('Message sent mesageId: %s', data.MessageId);
                rightMessage.push({ message: auxiliarArray, answer: data });
                page = page + 100;
                next();

            });

        },
        function (err) {

            if (err) {

                error('Error sending a message: %s', err.message);
                return callback(err, null);

            }
            log('Final data from whilst: %s');
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
