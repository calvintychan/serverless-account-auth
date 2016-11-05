import {
  authLogin,
  authSignup,
  authVerify
} from './lib';

module.exports.login = (event, context, cb) => {
  authLogin(event, context, (err, res) => {
    if (err) {
      console.log(err);
    } else {

    }
  });
};

module.exports.signup = (event, context, cb) => {
  authSignup(event, context, (err, res) => {
    if (err) {
      console.log(err);
    }
    console.log(res);
  });
};

module.exports.verify = (event, context, cb) => {
  authVerify(event, context, (err, res) => {
  });
};
