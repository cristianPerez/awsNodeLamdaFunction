/**
 * Producer Module
 * @module producer
 */

'use strict';


/**
 * Function that will be used in the serverless file and will be send as a lambda function,
 * which will use the "logic" function to create the database in dynamo.
 * @param {parameter} event - AWS uses to pass in event data to the handler.
 * @param {parameter} context - Provide your handler the runtime information of the Lambda function that is executing.
 * @param {parameter} callback - Return information to the caller, otherwise return value is null.
 */

module.exports.handler = (event, context, callback) => {

    const logicComplet = logic(getSales, getOrder);
    logicComplet(event, context, callback);

};
