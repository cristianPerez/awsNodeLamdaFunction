'use strict';

const aws = require('aws-sdk');
/**
 * csv module for process the file.
 */
const parse = require('csv-parse');
const s3 = new aws.S3();

const { log, error } = console;

exports.getS3Data = function (body, urlQueue, callback) {

    const answer = {
        response: {
            date: new Date(),
            status: 'processing',
            keyFile: body.Key,
            bucket: body.Bucket,
            queueUrl: urlQueue
        }
    };

    const parser = parse({ delimiter: ';', columns: true }, function (err, data) {

        if (err) {

            error('Error parsing the data from csv file %s', err);
            return callback(err, null);

        }
        answer.rows = data.length;
        answer.messages = data;
        return callback(null, answer);

    });

    s3.getObject(body).createReadStream().pipe(parser);

};
