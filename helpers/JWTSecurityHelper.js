'use strict';

const _ = require('lodash');
const config = require('config');
const JWT = require('jsonwebtoken');
const app = require('connect')();
const KeyCloakCerts = require('get-keycloak-public-key');
const { User } = require('../models');
const request = require("request");
const { AuthorizationError, RuntimeError } = require('../helpers/bts-error-utils');

// const keycloak = require('keycloak-backend')({
//   "realm": "demo-public",
//   "auth-server-url": "https://identity.bettertechsolutions.net",
//   "client_id": "TestClient",
//   "client_secret": "06a76897-f10d-4c27-a600-7a79a23cd26c", // if required
//   "username": "test1@test.co",
//   "password": "test"
// });


//const keycloak = require('../helpers/keycloak-config').getKeycloak();
/**
 * This module contains methods that assists with swaggers security
 * and JWT verification.
 *
 * @module JWTSecurityHelper
 */
module.exports = {
    /**
     * Method to create and sign the JWT to be passed onto the downstream service
     *
     * @param {Object} tokenPayload - This is the payload to encode
     * @param {function} next - The callback with structure function(err)
     */
    signJWT: function signJWT(tokenPayload, next) {

        JWT.sign(tokenPayload, config.keys.jwt_secret_key, (err, signedToken) => {
            if (err) {
                let runtimeError = new RuntimeError('There was an error while signing the jwt token');
                return next(runtimeError);
            }
            let authentication = {
                'token': signedToken
            };
            return next(null, authentication);
        });
    },
    /**
     * Verify the JWT token with the secret
     *
     * @param {object} req - The request object
     * @param {object} token - The token passed to the helper
     * @param {object} secret - The secret specified by the api
     * @param {function} next - The next callback with structure function(err)
     */
    jwtVerification: async function jwtVerification(req, token, secret, next) {
        const keyCloakCerts = new KeyCloakCerts(JWT.decode(token).iss + '/protocol/openid-connect/certs');
        const kid = JWT.decode(token, { complete: true }).header.kid;
        const publicKey = await keyCloakCerts.fetch(kid);
        if (publicKey) {
            try {
                JWT.verify(token, publicKey, function validate(err, decoded) {
                    if (err) {
                        return next(new AuthorizationError('Invalid token specified'));
                    }
                })

            } catch (error) {
                // Token is not valid
                return next(new AuthorizationError('Invalid token specified'));
            }
        } else {
            // KeyCloak has no Public Key for the specified KID
            return next(new AuthorizationError('Invalid token specified'));
        }

    },
    /**
     * Check the blog role from the JWT token
     *
     * @param {object} req - The request object
     * @param {object} token - The token passed to the helper
     * @param {object} secret - The secret specified by the api
     * @param {function} next - The next callback with structure function(err)
     */
    checkBlogRole: async function checkBlogRole(req, token, secret, next) {
        let jwtToken = req.headers['x-request-jwt'];
        const { exp } = JWT.decode(jwtToken);
        if (exp < new Date() / 1000) {
            new RuntimeError('token is expired');
        }
        if (!jwtToken) {
            return next(
                new RuntimeError('Missing required JWT header')
            );
        }

        if (jwtToken) {
            var options = {
                'method': 'GET',
                'url': JWT.decode(jwtToken).iss + '/protocol/openid-connect/userinfo',
                'headers': {
                    'Authorization': 'Bearer ' + jwtToken,
                    'Cookie': 'KEYCLOAK_LOCALE=en'
                },
                form: {

                }
            };
            request(options, function (error, response) {
                if (error) throw new Error(error);
                if (response.statusCode !== 200) {
                    return next(new AuthorizationError('unauthorized user.'));
                }
                console.log(response.body);
                return next();
            });

        } else {
            // there is no token, don't process request further
            return next(new AuthorizationError('unauthorized user'));
        }

        JWT.verify(token, secret, function roleAuthentication(err, decoded) {
            console.log(JWT.decode(token));
            var keyCloakRole = [];
            var role = "";
            var keycloakObject = JWT.decode(token);
            var resource_access = keycloakObject.resource_access;
            for (var key in resource_access) {
                if (key === keycloakObject.azp) {
                    var roles = resource_access[key];
                    for (var keyname in roles) {
                        //console.log(roles[keyname]);
                        keyCloakRole = roles[keyname];
                    }
                }

            }
            for (var i = 0; i < keyCloakRole.length; i++) {
                console.log(keyCloakRole[i]);
                role = keyCloakRole[i]
            }
             console.log(req.swagger.operation['x-role']);
            if (!_.isEqual(role, req.swagger.operation['x-role'])) {
                return next(new AuthorizationError('This api is not accessible for your role'));
            }
            return next();
        });
    },



    /**
     * Check user status from the JWT token
     *
     * @param {object} req - The request object
     * @param {object} token - The token passed to the helper
     * @param {object} secret - The secret specified by the api
     * @param {function} next - The next callback with structure function(err)
     */
    manageBlockUser: function manageBlockUser(req, token, secret, next) {
        JWT.verify(token, secret, function roleAuthentication(err, decoded) {
            if (err) {
                return next(new AuthorizationError('Invalid token specified'));
            }
            User.findOne({ _id: decoded.user_id })
                .select('-password')
                .exec((userFindOneError, userRecord) => {
                    if (userFindOneError) {
                        let runtimeErrorObj = new RuntimeError(
                            'There was an error while checking block user',
                            userFindOneError
                        );
                        return next(runtimeErrorObj);
                    }
                    if (userRecord.is_deleted === true) {
                        return next(new AuthorizationError('You are no longer able to access this functionalities'));
                    }
                    return next();
                });
        });
    }
};