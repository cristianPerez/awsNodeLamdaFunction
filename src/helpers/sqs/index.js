'use strict';

const aws = require('aws-sdk');
const { whilst } = require('async');

const sqs = new aws.SQS();
const { log, error } = console;
const customerName = process.env.CUSTOMER_NAME;

const sendMessage = (mesagge, queueUrl, callback) => {

    try {

        var params = {
            MessageBody: JSON.stringify(mesagge),
            QueueUrl: queueUrl,
            DelaySeconds: 0,
            MessageGroupId: mesagge.uuid
        };

        sqs.sendMessage(params, (err, data) => {

            if (err) {

                error('Error sending a message: %s', err.message);
                return callback(err, null);

            }
            log('Mesagge already sent : %s', JSON.stringify(data));
            callback(null, data);

        });

    } catch (err) {

        error('Error sending a message: %s', err.message);
        return callback(err, null);

    }

};

const sendBatch = (uuid, messages, queueUrl, callback) => {

    try {

        let rightMessage = [];
        let errorsMessages = [];

        whilst(() => {

            return messages.length > 0;

        },
        (next) => {

            let auxiliarArray = messages.splice(0, 100);
            let auxObj = {
                uuid,
                customerName,
                rows: auxiliarArray,
                last: messages.length === 0
            };
            sendMessage(auxObj, queueUrl, (err, data) => {

                if (err) {

                    error('Error during sent the mesage: %s error: %s', auxiliarArray, err.message);
                    errorsMessages.push({ auxiliarArray, answer: data });

                }
                log('Message sent mesageId: %s', data.MessageId);
                rightMessage.push({ message: auxiliarArray, answer: data });
                next();

            });

        },
        (err) => {

            if (err) {

                error('Error sending a message: %s', err.message);
                return callback(err, null);

            }
            log('Final data from whilst');
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
    sendBatch
};
