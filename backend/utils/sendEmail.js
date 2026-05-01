import nodemailer from 'nodemailer';
import dns from 'dns';

const sendEmail = async (options) => {
  // 1) Determine SMTP configuration (Dynamic or Default)
  const smtpConfig = options.smtpConfig || {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    senderName: 'Work Management'
  };

  try {
    // 2) Force DNS Resolution to IPv4 (Crucial for servers like Render/Vercel)
    let resolvedHost = smtpConfig.host;
    try {
        const lookup = await dns.promises.lookup(smtpConfig.host, { family: 4 });
        resolvedHost = lookup.address;
        console.log(`Resolved ${smtpConfig.host} to IPv4: ${resolvedHost}`);
    } catch (dnsErr) {
        console.warn('DNS lookup failed, using original host:', dnsErr.message);
    }

    const isSecure = Number(smtpConfig.port) === 465;

    // 3) Create a transporter
    const transporter = nodemailer.createTransport({
      pool: true,
      host: resolvedHost,
      port: Number(smtpConfig.port),
      secure: isSecure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
      // Production stability settings
      family: 4,
      connectionTimeout: 20000,
      greetingTimeout: 20000,
      socketTimeout: 30000,
      // Explicit settings for Port 587 (STARTTLS)
      requireTLS: !isSecure && Number(smtpConfig.port) === 587,
      tls: {
          rejectUnauthorized: false,
          servername: smtpConfig.host, // Important when using IP address as host
          minVersion: 'TLSv1.2'
      }
    });

    // 4) Define the email options
    const mailOptions = {
      from: `${smtpConfig.senderName || 'Work Management'} <${smtpConfig.user}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    // 5) Actually send the email
    console.log(`Attempting to send email to ${options.email} via ${resolvedHost}:${smtpConfig.port}...`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ Email Send Error Details:', {
        message: error.message,
        code: error.code,
        command: error.command,
        response: error.response,
        stack: error.stack
    });
    throw error;
  }
};

export default sendEmail;
