import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import { IJwtPayload } from '../app/interfaces';

const generateToken = (payload: IJwtPayload, secret: Secret, expiresIn: string) => {
    const token = jwt.sign(
        payload,
        secret,
        {
            algorithm: 'HS256',
            //* Env values like "7d" are valid `ms` strings; newer typings only accept the branded StringValue
            expiresIn: expiresIn as SignOptions['expiresIn']
        }
    );

    return token;
};

const verifyToken = (token: string, secret: Secret) => {
    return jwt.verify(token, secret) as JwtPayload;
}

export const jwtHelpers = {
    generateToken,
    verifyToken
}