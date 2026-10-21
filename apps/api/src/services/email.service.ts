
import nodemailer from "nodemailer";

const transporterPromise = nodemailer.createTestAccount().then((account) => {
  console.log("Ethereal test account ready");
  console.log("Ethereal username:", account.user);

  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  });
});

export async function sendTestEmail(data: {
  recipient: string;
  subject: string;
  body: string;
}) {
  const transporter = await transporterPromise;

  const info = await transporter.sendMail({
    from: '"ReachInbox Demo" <hello@reachinbox.test>',
    to: data.recipient,
    subject: data.subject,
    text: data.body,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info);

  console.log("Ethereal preview URL:", previewUrl);

  return {
    messageId: info.messageId,
    previewUrl: previewUrl ? String(previewUrl) : null,
  };
}
