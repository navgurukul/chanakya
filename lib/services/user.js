'use strict';

const Util = require('util');
const Schmervice = require('schmervice');
const SecurePassword = require('secure-password');
const JWT = require('jsonwebtoken');
const CONSTANTS = require('../constants');


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

    async createToken(user) {

        return await JWT.sign({ id: user.id, type: user.type }, this.options.jwtKey, {
            algorithm: 'HS256',
            expiresIn: '7d'
        });
    }


};
