
import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { User, loggedUser } from "../interface/userInterface";
dotenv.config()

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}

export interface ExtendedUserRequest extends Request {
    info?: loggedUser
}

export const verifyToken = (req: ExtendedUserRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers['authorization'];

        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization header missing"
            });
        }

        const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

        if (!token) {
            return res.status(401).json({
                message: "Token missing"
            });
        }

        const data = jwt.verify(token, SECRET) as loggedUser;
        req.info = data;
        next();

    } catch (error) {
        console.error('Token verification error:', error instanceof Error ? error.message : error);
        return res.status(401).json({
            message: "Invalid or expired token"
        });
    }
}