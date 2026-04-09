const { transporter } = require("../config/mail");
const { env } = require("../config/env");

const sendBookingEmail = async ({ to, subject, bookingDate, startTime, serviceName }) => {
  if (!env.mail.host || !env.mail.user) {
    // eslint-disable-next-line no-console
    console.log("Mail config not set. Skipping email to", to);
    return;
  }
  // Email sending disabled for now during local testing.
  // Uncomment below when SMTP is configured.
  /*
  const html = `
    <h3>Your booking is received</h3>
    <p>Service: ${serviceName}</p>
    <p>Date: ${bookingDate}</p>
    <p>Time: ${startTime}</p>
  `;
  await transporter.sendMail({
    from: env.mail.from,
    to,
    subject,
    html
  });
  */
};

module.exports = { sendBookingEmail };
