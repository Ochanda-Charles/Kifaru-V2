
import { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import { User, loggedUser } from "../interface/userInterface";
dotenv.config()

const SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development-only';

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

    } catch (error: any) {
        console.error('Token verification error:', error.message);
        return res.status(403).json({
            message: "Invalid or expired token",
            error: error.message
        });
    }
}