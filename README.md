# Serverless Authentication Starter Kit

A simple starter kit for creating a email/password login system with AWS Cognito, Lambda, and DynamoDB using the Serverless framework.

# Install
`npm install`

Make sure you copy the `config.json.copy` to `config.json` and update the AWS configuration.
You will also need to update the region attribute inside `serverless.yml`

# Running locally
`sls webpack serve`

# Deploy
`sls deploy`

# Test
Create a test user in the database
`sls webpack invoke -f signup -p account.json`

Login and get token from AWS cognito
`sls webpack invoke -f login -p account.json`
