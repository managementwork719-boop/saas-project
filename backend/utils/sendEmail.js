import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1) Determine SMTP configuration (Dynamic or Default)
  const smtpConfig = options.smtpConfig || {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    senderName: 'Work Management'
  };

  // 2) Create a transporter
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: Number(smtpConfig.port) === 465, // true for 465, false for other ports
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
    // Force IPv4 to avoid ENETUNREACH errors on servers with limited IPv6 support
    family: 4, 
    // For many providers, we need to allow self-signed certificates in dev
    tls: {
        rejectUnauthorized: false
    }
  });

  // 3) Define the email options
  const mailOptions = {
    from: `${smtpConfig.senderName || 'Work Management'} <${smtpConfig.user}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // 4) Actually send the email
  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.email} via ${smtpConfig.host}`);
  } catch (error) {
    console.error('Email send failed:', error);
    throw new Error(`Error sending email: ${error.message}`);
  }
};

export default sendEmail;
