# sls-import-functions

## Install

- Install dependencies:
```bash
npm install
```
- Install serverless globally using next command.

```bash
npm i -g serverless
```

## Configuration

- For configurate your local environment use the next command and replace the xxxxxx with your AWS credentials.

```bash
serverless config credentials --provider aws --key xxxxxxxx --secret xxxxxxxxxx
```

## Preparing

- For check that you have your credentials you can do the next command:

```bash
cat ~/.aws/credentials
```

## Deploy

- Run that command: 

```bash
sls deploy -v
```
