import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // 1) Determine SMTP configuration (Dynamic from DB or Default from Env)
  const smtpConfig = options.smtpConfig || {
    host: process.env.SMTP_HOST || 'smtp-relay.sendinblue.com',
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    senderName: 'Work Management'
  };

  const isSecure = Number(smtpConfig.port) === 465;

  // 2) Create a transporter optimized for Production Relays (Brevo/SendGrid)
  const transporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: Number(smtpConfig.port),
    secure: isSecure, 
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
    // Production stability settings
    family: 4, // Still force IPv4 to be safe
    connectionTimeout: 30000, // Increased to 30 seconds
    greetingTimeout: 30000,
    socketTimeout: 45000,
    // Explicit STARTTLS for Port 587/2525
    requireTLS: !isSecure && [587, 2525].includes(Number(smtpConfig.port)),
    tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    }
  });

  // 3) Define the email options
  const mailOptions = {
    from: `${smtpConfig.senderName || 'Work Management'} <${smtpConfig.senderEmail || smtpConfig.user}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html,
  };

  // 4) Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${options.email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email Send Error:', error.message);
    throw error;
  }
};

export default sendEmail;
