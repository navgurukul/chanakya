const Util = require("util");
const Schmervice = require("schmervice");
const SecurePassword = require("secure-password");
const JWT = require("jsonwebtoken");
const fs = require("fs");
const Dotenv = require("dotenv");
const _ = require("underscore");
const { OAuth2Client } = require("google-auth-library");
const CONSTANTS = require("../constants");
const sendEmail = require("../helpers/sendEmail");

Dotenv.config({ path: `${__dirname}/../.env` });

function displayUser({ password, ...user }) {
  return { ...user };
}

module.exports = class UserService extends (
  Schmervice.Service
) {
  constructor(...args) {
    super(...args);

    const pwd = new SecurePassword();

    this.pwd = {
      hash: Util.promisify(pwd.hash.bind(pwd)),
      verify: Util.promisify(pwd.verify.bind(pwd)),
    };
  }

  async findById(id, txn) {
    const { Users } = this.server.models();

    const user = await Users.query(txn).throwIfNotFound().findById(id);
    return user;
  }

  async create(txn) {
    const { User } = this.server.models();

    const id = await User.query(txn).insert({
      name: "Rishabh Verma",
      type: CONSTANTS.userTypes.team,
      email: "r@navgurukul.org",
      mobile: "8130378953",
      password: await this.pwd.hash(Buffer.from("bad-password")),
    });

    return id;
  }

  async googleLogin(idToken, txn = null) {
    const { Users } = this.server.models();
    const clientId = CONSTANTS.users.auth.googleClientID;

    const client = new OAuth2Client(clientId);
    const response = await client.verifyIdToken({
      idToken: idToken,
      audience: clientId,
    });

    const userObj = {
      user_name: response.payload.name,
      mail_id: response.payload.email.split("@")[0],
      email: response.payload.email,
      profile_pic: response.payload.picture,
      google_user_id: response.payload.sub,
    };

    let user = await Users.query(txn).findOne({ email: userObj.email });
    if (!user) {
      user = await Users.query(txn).insert(userObj);
    } else {
      user = await Users.query(txn).updateAndFetchById(user.id, userObj);
    }
    return user;
  }

  async userMobileNumber(user_id, mobile, txn = null) {
    const { Users } = this.server.models();
    const addmobileNo = await Users.query(txn)
      .update(mobile)
      .where("id", user_id);
    const [user] = await Users.query(txn).where("id", user_id);
    return {
      addmobileNo,
      user,
    };
  }

  async login({ email, password }, txn) {
    const { Users } = this.server.models();
    const user = await Users.query(txn)
      .throwIfNotFound()
      .first()
      .where({ email });

    const passwordCheck = await this.pwd.verify(
      Buffer.from(password),
      user.password
    );

    if (passwordCheck === SecurePassword.VALID_NEEDS_REHASH) {
      await this.changePassword(user.id, password, txn);
    } else if (passwordCheck !== SecurePassword.VALID) {
      throw Users.createNotFoundError();
    }

    return displayUser(user);
  }

  async changePassword(user_id, password, txn) {
    const { Users } = this.server.models();

    await Users.query(txn)
      .throwIfNotFound()
      .where({ user_id })
      .patch({
        password: await this.pwd.hash(Buffer.from(password)),
      });

    return user_id;
  }

  // Create JWT token for authentication purpose.
  async createToken(user) {
    const JWTtoken = await JWT.sign(
      { id: user.id, email: user.email },
      CONSTANTS.users.jwt.secret,
      {
        algorithm: "HS256",
        expiresIn: CONSTANTS.users.jwt.expiresIn,
      }
    );
    return JWTtoken;
  }

  // SignUp new user access for ngTeam and students
  async signUp(User, txn = null) {
    const user = User;
    const { Users } = this.server.models();

    user.password = await this.pwd.hash(Buffer.from(user.password));

    const users = await Users.query(txn).whereNot("email", user.email);
    let retUser;
    if (users) {
      if (user.partner_id === 0) {
        delete user.partner_id; // remove from partner_id because it want greater than 0.
        retUser = await Users.query(txn).insert(user);
      } else {
        retUser = await Users.query(txn).insert(user);
      }
    }
    return retUser;
  }

  // send SMS & Email to logged user.
  async sendSMSandEmailtoUser(User) {
    const user = User;
    const { exotelService } = this.server.services();

    const EmailReciver = [user.email];
    const source = fs.readFileSync(
      CONSTANTS.gSheet.emailReport.userReport,
      "utf-8"
    );
    const textMessage = source.toString();
    const { cc } = CONSTANTS.gSheet.emailReport;
    const subject = CONSTANTS.gSheet.emailReport.userSubject;
    await sendEmail.SESEmail(EmailReciver, textMessage, cc, subject, true); // sendEmailtoUser

    if (user.type === 1) {
      user.type = "newUserTeam";
    } else if (user.type === 2) {
      user.type = "newUserStudent";
    } else {
      user.type = "newUserPartner";
    }
    const templateContext = {
      user,
    };
    const informToUser = await exotelService.sendSMS(
      user.mobile,
      user.type,
      templateContext
    );
    return informToUser;
  }

  async findAll(txn = null) {
    const { Users } = this.server.models();
    const allUsers = await Users.query(txn);
    const alluser = [];
    _.each(allUsers, (u) => {
      if (u.email.includes("@navgurukul")) {
        const user = u.email.split("@")[0];
        alluser.push({ id: u.id, user, profile_pic: u.profile_pic });
      }
    });
    return alluser;
  }

  async findByType(type, eagerExpr = null, txn = null) {
    const { User } = this.server.models();
    let user = User.query(txn).where("type", type);
    if (eagerExpr) {
      user = user.withGraphFetched(eagerExpr);
    }
    const typeOfUser = await user;
    return typeOfUser;
  }

  // update the users deatils if it exist in database.
  async userUpdate(user_id, Details, txn = null) {
    const details = Details;
    const { Users } = this.server.models();
    details.password = await this.pwd.hash(Buffer.from(details.password));

    if (details.partner_id === 0) {
      delete details.partner_id;
      const updatePartnerUser = await Users.query(txn)
        .update(details)
        .where({ id: user_id });
      return updatePartnerUser;
    }
    const updateUser = await Users.query(txn)
      .update(details)
      .where({ id: user_id });
    return updateUser;
  }

  async navgurukulAdvertisement(txn = null) {
    const { Contact } = this.server.models();
    const { exotelService } = this.server.services();

    const contacts = await Contact.query(txn);
    const sendSMSPromises = [];
    const smsType = "navgurukulAdvertisement";
    _.each(contacts, async (contact) => {
      if (exotelService.hasTemplateForStage(smsType) === true) {
        const templateContext = {
          contact,
        };
        sendSMSPromises.push(
          exotelService.sendSMS(contact.mobile, smsType, templateContext)
        );
      }
    });

    const sendSMSpromise = await Promise.all(sendSMSPromises);
    return sendSMSpromise;
  }
};
