module.exports = {
    database: {
        host: process.env.MSQLHOST || 'localhost',
        port: process.env.MSQLPORT || 27483,
        user: process.env.MSQLUSER || 'root',
        password: process.env.MSQLPASSWORD || 'root074203',
        database: process.env.MSQLDATABASE || 'node-mysql-signup-verification-api'
    },
    secret: process.env.JWT_SECRET || '9087cae9-0886-407e-8cd0-32ab52be42a7',
    emailFrom: process.env.EMAIL_FROM || 'info@node-mysql-signup-verification-api.com',
    smtpOption: { 
        host: process.env.SMTP_HOST || 'smtp.ethereal.email', 
        port: process.env.SMTP_PORT || 587, 
        auth: {
            user: process.env.SMTP_USER || 'casper.wiegand@ethereal.email',
            pass: process.env.SMTP_PASSWORD || 'gc2GbPC277MUW4FmY9'
        },
    },
};