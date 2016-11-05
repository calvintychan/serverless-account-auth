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
const cognitoIdentity = new AWS.CognitoIdentity();

const computeHash = (password, salt, cb) => {
  const keylen = 512;
  const iterations = 4096;
  const digest = 'sha512';

  crypto.pbkdf2(password, salt, iterations, keylen, digest, (err, derivedKey) => {
    if (err) return cb(err);
    cb(null, derivedKey.toString('base64'));
  });
};

const getAccount = (email, cb) => {
  const params = {
    TableName: process.env.STAGE + '-accounts',
    Key: { email }
  };
  dynamo.get(params, (err, data) => {
    if (err) {
      cb(err);
    } else {
      if (data.Item) {
        cb(null, data.Item);
      } else {
        cb('Account not found.', null);
      }
    }
  });
};

const getToken = (email, cb) => {
  const params = {
    IdentityPoolId: process.env.IDENTITY_POOL_ID,
    Logins: {}
  };
  params.Logins[process.env.DEVELOPER_PROVIDER_NAME] = email;
  cognitoIdentity.getOpenIdTokenForDeveloperIdentity(params, (err, data) => {
    cb(err, data); // { IdentityId, Token }
  });
};

const authLogin = (event, context, cb) => {
  context.callbackWaitsForEmptyEventLoop = false;
  const email = event.body.email;
  const password = event.body.password;

  getAccount(email, (err, account) => {
    if (err) {
      cb(err);
    } else {
      console.log('Account found: ', email);
      const { passwordHash, salt } = account;
      computeHash(password, salt, (err, computedHash) => {
        if (err) {
          cb('Error computing hash');
        } else {
          if (computedHash !== passwordHash) {
            cb('Hash miss matched!');
          } else {
            getToken(email, (err, {IdentityId, Token}) => {
              if (err) {
                console.log(`Error getting token ${err}`);
                cb(`Error getting token ${err}`);
              } else {
                console.log('Token: ', Token);
                cb(null, {IdentityId, Token});
              }
            });
          }
        }
      });
    }
  });
};

export default authLogin;
