import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sqlConfig } from "../config/sqlConfig";
const SECRET = 'Q45gt23crfe';

export const loginUser = async (req: Request, res: Response) => {
    try {
        const { merchantEmail, password } = req.body;

        // Validate input (optional)
        // let { error } = loginUserValidator.validate(req.body);
        // if (error) return res.status(400).json({ error: error.details[0].message });

        const query = 'SELECT * FROM merchants WHERE email = $1';
        const values = [merchantEmail];
        const result = await sqlConfig.query(query, values);

        const user = result.rows[0];
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const correctPwd = await bcrypt.compare(password, user.password_hash);
        if (!correctPwd) {
            return res.status(401).json({ error: "Incorrect password" });
        }

        //Prepare payload for JWT (excluding password)
        const { password_hash: ignoreThis, ...loginCredentials } = user;

        //Generate JWT token
        const token = jwt.sign(loginCredentials, SECRET, { expiresIn: '3600s' });

        return res.status(200).json({
            message: "Logged in successfully",
            token,
            ...loginCredentials
        });

    } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
