import { sqlConfig } from '../sqlConfig/sqlconfig'
import ejs from 'ejs'
import { sendMail } from '../helpers/emailHelppers'

// dotenv.config()  
// import dotenv from 'dotenv'

export const welcomeUser = async () => {
    const pool = await sqlConfig.connect()

 const result = await pool.query('SELECT * FROM WELCOMEUSER()')
        const users = result.rows
    console.log(users);
    for (let user of users) {
        ejs.renderFile('templates/welcome.ejs', { firstName: user.firstName }, async (error, data) => {
            let mailOptions = {
                from: "daogodwin@gmail.com",
                to: user.email,
                subject: "Welcome to Kifaru",
                html: data
            }

            try {
                await sendMail(mailOptions)
                await pool.query('UPDATE Users SET isWelcomed = 1 WHERE isWelcomed = 0 AND isDeleted = 0')
                console.log("Emails sent to new users");
            } catch (error) {
                console.log(error);

            }
        })
    }
}
