# node-imports-service

## Install

- Install dependencies: `npm install`

## Configuration
* Create file with name `.env` and save it in the root of the project `.env` with content:

```bash
#
## APP
#
HOST=0.0.0.0
PORT=9090
NODE_ENV=development

#
## AWS **ALL REQUIRED**
#
DYNAMO_URL=Could be remote or http://localhost:8000
AWS_REGION=Example -- us-east-1
AWS_ACCESS_KEY_ID=AWS ACCESS KEY ID HERE
AWS_SECRET_ACCESS_KEY=AWS SECRET KEY ID HERE
AWS_S3_BUCKET=NAME OF THE BUCKET EXAMPLE envista
EVENT_SERVICE_URL=http://localhost:9999
CUSTOMER_NAME=envwine

```

* CSV File example public

https://s3.amazonaws.com/envista/example-imports.csv

## Usage

## Debug

### Create a new micro-service

## API

## Deploy

- Run that command: `serverless deploy -v`

## Contribute
