import AWS from 'aws-sdk';
import config from '../config';
import crypto from 'crypto';
config();

AWS.config.update({
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
  region: process.env.REGION,
});

const dynamo = new AWS.DynamoDB.DocumentClient();

const generateHash = (password, cb) => {
  const keylen = 512;
  const iterations = 4096;
  const digest = 'sha512';

  crypto.randomBytes(keylen, (err, salt) => {
    if (err) return cb(err);
    salt = salt.toString('base64');
    crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
      if (err) return cb(err);
      cb(null, salt, derivedKey.toString('base64'));
    });
  });
};

const saveAccount = (email, password, salt, cb) => {
  console.log('Save account: ', email, password, salt);
  const keylen = 32;
  crypto.randomBytes(keylen, (err, token) => {
    if (err) return cb(err);
    token = token.toString('hex');
    const params = {
      TableName: process.env.STAGE + '-accounts',
      Item: {
        email: email,
        passwordHash: password,
        salt: salt,
        verified: false,
        verifyToken: token
      },
      ConditionExpression: 'attribute_not_exists (email)'
    };
    console.log('Account params: ', params);
    dynamo.put(params, (err) => {
      if (err) {
        return cb(err);
      } else {
        cb(null, token);
      }
    });
  });
};

const authSignup = (event, context, cb) => {
  const email = event.body.email;
  const password = event.body.password;

  context.callbackWaitsForEmptyEventLoop = false;

  generateHash(password, (err, salt, hash) => {
    if (err) {
      context.fail(`Error in hash ${err}`);
    } else {
      saveAccount(email, hash, salt, (err, token) => {
        if (err) {
          if (err.code === 'ConditionCheckFailedException') {
            cb(null, {created: false});
          } else {
            cb(`Error saving account ${err}`, {created: false});
          }
        } else {
          // TODO Send verification email
          cb(null, token);
        }
      });
    }
  });
};

export default authSignup;
