
const Util = require('util');
const Schmervice = require('schmervice');
const SecurePassword = require('secure-password');
const JWT = require('jsonwebtoken');
const fs = require('fs');
const Dotenv = require('dotenv');
const { OAuth2Client } = require('google-auth-library');
const CONSTANTS = require('../constants');
const sendEmail = require('../helpers/sendEmail');

Dotenv.config({ path: `${__dirname}/../.env` });

function displayUser({ password, ...user }) {
  return { ...user };
}

module.exports = class UserService extends Schmervice.Service {
  constructor(...args) {
    super(...args);

    const pwd = new SecurePassword();

    this.pwd = {
      hash: Util.promisify(pwd.hash.bind(pwd)),
      verify: Util.promisify(pwd.verify.bind(pwd)),
    };
  }

  async findById(id, txn) {
    const { User } = this.server.models();

    const user = await User.query(txn).throwIfNotFound().findById(id);
    return user;
  }

  async create(txn) {
    const { User } = this.server.models();

    const id = await User.query(txn).insert({
      name: 'Rishabh Verma',
      type: CONSTANTS.userTypes.team,
      email: 'r@navgurukul.org',
      mobile: '8130378953',
      password: await this.pwd.hash(Buffer.from('bad-password')),
    });

    return id;
  }

  async googleLogin(Token, txn = null) {
    const { Users } = this.server.models();
    const clientId = process.env.CLIENT_ID;
    const token = Token.id_token;

    const client = new OAuth2Client(clientId);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: clientId,
    });

    const userDetails = ticket.payload;
    const user = await Users.query(txn).insert({
      user_name: userDetails.name,
      email: userDetails.email,
      profilePic: userDetails.picture,
      googleUserId: userDetails.sub,
    });
    return user;
  }

  async login({ email, password }, txn) {
    const { User } = this.server.models();

    const user = await User.query(txn).throwIfNotFound().first().where({ email });

    const passwordCheck = await this.pwd.verify(Buffer.from(password), user.password);

    if (passwordCheck === SecurePassword.VALID_NEEDS_REHASH) {
      await this.changePassword(user.id, password, txn);
    } else if (passwordCheck !== SecurePassword.VALID) {
      throw User.createNotFoundError();
    }

    return displayUser(user);
  }

  async changePassword(userId, password, txn) {
    const { User } = this.server.models();

    await User.query(txn).throwIfNotFound().where({ userId }).patch({
      password: await this.pwd.hash(Buffer.from(password)),
    });

    return userId;
  }

  // Create JWT token for authentication purpose.
  async createToken(user) {
    const JWTtoken = await JWT.sign({ id: user.id, email: user.email }, this.options.jwtKey, {
      algorithm: 'HS256',
      expiresIn: '7d',
    });
    return JWTtoken;
  }

  // SignUp new user access for ngTeam and students
  async signUp(Users, txn = null) {
    const user = Users;
    const { User } = this.server.models();

    user.password = await this.pwd.hash(Buffer.from(user.password));

    const users = await User.query(txn).whereNot('email', user.email);
    let retUser;
    if (users) {
      if (user.partnerId === 0) {
        delete user.partnerId; // remove from partnerid because it want greater than 0.
        retUser = await User.query(txn).insert(user);
      } else {
        retUser = await User.query(txn).insert(user);
      }
    }
    return retUser;
  }

  // send SMS & Email to logged user.
  async sendSMSandEmailtoUser(User) {
    const user = User;
    const { exotelService } = this.server.services();

    const EmailReciver = [user.email];
    const source = fs.readFileSync(CONSTANTS.gSheet.emailReport.userReport, 'utf-8');
    const textMessage = source.toString();
    const { cc } = CONSTANTS.gSheet.emailReport;
    const subject = CONSTANTS.gSheet.emailReport.userSubject;
    await sendEmail.SESEmail(EmailReciver, textMessage, cc, subject, true); // sendEmailtoUser

    if (user.type === 1) {
      user.type = 'newUserTeam';
    } else if (user.type === 2) {
      user.type = 'newUserStudent';
    } else {
      user.type = 'newUserPartner';
    }
    const templateContext = {
      user,
    };
    const informToUser = await exotelService.sendSMS(user.mobile, user.type, templateContext);
    return informToUser;
  }

  async findAll(txn) {
    const { User } = this.server.models();
    const users = await User.query(txn);
    return users;
  }

  async findByType(type, eagerExpr = null, txn = null) {
    const { User } = this.server.models();
    let user = User.query(txn).where('type', type);
    if (eagerExpr) {
      user = user.eager(eagerExpr);
    }
    const typeOfUser = await user;
    return typeOfUser;
  }

  // update the users deatils if it exist in database.
  async userUpdate(userId, Details, txn = null) {
    const details = Details;
    const { User } = this.server.models();
    details.password = await this.pwd.hash(Buffer.from(details.password));

    if (details.partnerId === 0) {
      delete details.partnerId;
      const updatePartnerUser = await User.query(txn).update(details).where({ id: userId });
      return updatePartnerUser;
    }
    const updateUser = await User.query(txn).update(details).where({ id: userId });
    return updateUser;
  }

  async getUserByName(userType, txn = null) {
    const typeOfuser = userType;
    const { User } = this.server.models();
    const user = User.query(txn).where('type', typeOfuser);
    return user;
  }
};
