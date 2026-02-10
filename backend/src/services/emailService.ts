import nodemailer from 'nodemailer';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

const createTransporter = () => {
  if (!config.smtp.host || !config.smtp.user) {
    return null;
  }

  return nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });
};

export const sendInvitationEmail = async (email: string, code: string): Promise<boolean> => {
  const transporter = createTransporter();

  if (!transporter) {
    logger.warn(`SMTP not configured. Invitation code for ${email}: ${code}`);
    return false;
  }

  const htmlContent = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
      <h1 style="font-size: 24px; color: #1a1a1a; margin-bottom: 8px;">Family Threads</h1>
      <p style="font-size: 15px; color: #666; margin-bottom: 32px;">가족만을 위한 공간에 초대합니다.</p>
      <div style="background: #f8f8f8; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <p style="font-size: 13px; color: #999; margin: 0 0 12px 0;">초대 코드</p>
        <p style="font-size: 32px; font-weight: bold; color: #007AFF; letter-spacing: 6px; margin: 0;">${code}</p>
      </div>
      <p style="font-size: 14px; color: #666; line-height: 1.6;">
        앱을 설치한 후 위 초대 코드를 입력하여 가입하세요.<br/>
        이 코드는 1회만 사용할 수 있습니다.
      </p>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: config.smtp.from,
      to: email,
      subject: 'Family Threads 초대 코드',
      html: htmlContent,
    });
    logger.info(`Invitation email sent to ${email}`);
    return true;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Failed to send invitation email to ${email}: ${message}`);
    return false;
  }
};
