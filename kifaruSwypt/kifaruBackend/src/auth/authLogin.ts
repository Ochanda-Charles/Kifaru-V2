import { Request, Response } from "express";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { sqlConfig } from "../config/sqlConfig";

const SECRET = process.env.JWT_SECRET;
if (!SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Refusing to start.');
}

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

        // Sign only the minimum required claims — never encode the full user row
        const tokenPayload = {
            merchant_id: user.merchant_id,
            email: user.email,
        };

        const token = jwt.sign(tokenPayload, SECRET, { expiresIn: '7d' });

        return res.status(200).json({
            message: "Logged in successfully",
            token,
            merchant_id: user.merchant_id,
            username: user.merchantusername,
        });

    } catch (error) {
        console.error('Error logging in:', error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
