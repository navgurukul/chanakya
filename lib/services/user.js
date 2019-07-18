'use strict';

const Util = require('util');
const Schmervice = require('schmervice');
const SecurePassword = require('secure-password');
const JWT = require('jsonwebtoken');
const CONSTANTS = require('../constants');
const fs = require('fs');
const sendEmail = require('../helpers/sendEmail')


module.exports = class UserService extends Schmervice.Service {

    constructor(...args) {

        super(...args);

        const pwd = new SecurePassword();

        this.pwd = {
            hash: Util.promisify(pwd.hash.bind(pwd)),
            verify: Util.promisify(pwd.verify.bind(pwd))
        };
    }

    _displayUser({ password, ...user }, ) {
        return { ...user };
    }

    async findById(id, txn) {
        
        const { User } = this.server.models();

        return await User.query(txn).throwIfNotFound().findById(id);

    }

    async create(txn) {
        
        const { User } = this.server.models();

        let id = await User.query(txn).insert({
            name: 'Rishabh Verma',
            type: CONSTANTS.userTypes.team,
            email: 'r@navgurukul.org',
            mobile: '8130378953',
            password: await this.pwd.hash(Buffer.from('bad-password'))
        })

        return id;

    }

    async login({email, password}, txn) {

        const { User } = this.server.models();

        const user = await User.query(txn).throwIfNotFound().first().where({ email });

        const passwordCheck = await this.pwd.verify(Buffer.from(password), user.password);

        if (passwordCheck === SecurePassword.VALID_NEEDS_REHASH) {
            await this.changePassword(user.id, password, txn);
        }
        else if (passwordCheck !== SecurePassword.VALID) {
            throw User.createNotFoundError();
        }

        return this._displayUser(user);

    }

    async changePassword(userId, password, txn) {

        const { User } = this.server.models();

        await User.query(txn).throwIfNotFound().where({ userId }).patch({
            password: await this.pwd.hash(Buffer.from(password))
        });

        return id;

    }

    // Create JWT token for authentication purpose.
    async createToken(user) {

        return await JWT.sign({ id: user.id, type: user.type }, this.options.jwtKey, {
            algorithm: 'HS256',
            expiresIn: '7d'
        });
    }
    
    // SignUp new user access for ngTeam and students
    async signUp(user, txn=null) {
        const { User } = this.server.models();
        
        user.password = await this.pwd.hash(Buffer.from(user.password))
        
        let users = await User.query(txn).whereNot('email', user.email);
        if (users) {
            if (user.partnerId == 0) {
                delete user.partnerId // remove from partnerid because it want greater than 0.
                return await User.query(txn).insert(user)
            }else{
                return await User.query(txn).insert(user)
            }
        }
    }
    
    // send SMS & Email to logged user.
    async sendSMSandEmailtoUser(user, txn=null){
        const { exotelService } = this.server.services();
        
        const EmailReciver = [user.email];
        const source = fs.readFileSync(CONSTANTS.gSheet.emailReport.userReport, 'utf-8');
        const textMessage = source.toString()
        const cc = CONSTANTS.gSheet.emailReport.cc
        const subject = CONSTANTS.gSheet.emailReport.userSubject
        let sendEmailtoUser = await sendEmail.SESEmail(EmailReciver, textMessage, cc, subject,  true);
        
        if (user.type == 1){
            user.type = 'newUserTeam';
        }else if (user.type == 2){
            user.type = 'newUserStudent';
        }else{
            user.type = 'newUserPartner';
        }
        const templateContext = {
            user,
        }
        return await exotelService.sendSMS(user.mobile, user.type, templateContext)
    }

    async findAll(txn) {
        const { User } = this.server.models();
        return await User.query(txn);
    }

    async findByType(type, eagerExpr=null, txn=null) {
        const { User } = this.server.models();
        let user = User.query(txn).where('type', type);
        if (eagerExpr) {
            user = user.eager(eagerExpr);
        }
        return await user;
    }

    // update the users deatils if it exist in database.
    async userUpdate(userId, details, txn=null) {
        
        const { User } = this.server.models();
        details.password = await this.pwd.hash(Buffer.from(details.password))
        
        if (details.partnerId == 0) {
            delete details.partnerId
            return await User.query(txn).update(details).where( {id: userId} )
        }else{
            return await User.query(txn).update(details).where({ id: userId })
        }
    }
};
