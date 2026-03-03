import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config();

interface mail_configs{
    service: string;
    host: string;
    port: number;
    requireTLS: boolean,
    auth:{
        user: string,
        pass: string
    }
}

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('FATAL: EMAIL_USER and EMAIL_PASS environment variables must be set');
}

function createTransporter(config: mail_configs) {
    const transporter = nodemailer.createTransport(config)

    return transporter
}

let configurations: mail_configs = ({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    requireTLS: true,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

export const sendMail = async (messageOption: any) => {
    const transporter = await createTransporter(configurations)

    await transporter.verify()

    await transporter.sendMail(messageOption, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log(info.response);
        }
    })
}