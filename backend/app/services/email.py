import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import settings

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("QuantCoachEmailService")

def _send_smtp_email(to_email: str, subject: str, text_body: str, html_body: str) -> None:
    """
    Helper function to send email via SMTP with support for STARTTLS (587) and SSL (465),
    automatic password whitespace cleanup (for Google App Passwords), and Gmail sender alignment.
    """
    if not settings.EMAILS_ENABLED or not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        logger.info("\n" + "="*60 +
                    f"\n[MOCK EMAIL SENT - REAL SMTP NOT ACTIVE]" +
                    f"\nTo: {to_email}" +
                    f"\nSubject: {subject}" +
                    f"\nBody: {text_body}" +
                    "\n" + "="*60 + "\n")
        return

    # Clean Google app password by removing any spaces
    smtp_pass = settings.SMTP_PASSWORD.replace(" ", "").strip()
    smtp_user = settings.SMTP_USER.strip()
    
    # Gmail requires the authenticated user's address as envelope sender
    sender = smtp_user if ("gmail" in settings.SMTP_HOST.lower() or "@quantcoach.ai" in (settings.SMTP_FROM or "")) else (settings.SMTP_FROM or smtp_user)
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.PROJECT_NAME} <{sender}>"
    msg["To"] = to_email

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        # Connect to SMTP server (try port 587 or 465 with fallback)
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, 465, timeout=12)
        else:
            try:
                server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
                server.ehlo()
                server.starttls()
            except Exception as conn_err:
                logger.warning(f"SMTP port {settings.SMTP_PORT} failed ({conn_err}), falling back to SSL port 465...")
                server = smtplib.SMTP_SSL(settings.SMTP_HOST, 465, timeout=12)

        server.login(smtp_user, smtp_pass)
        server.sendmail(sender, to_email, msg.as_string())
        server.quit()
        logger.info(f"Successfully delivered email '{subject}' to {to_email} via SMTP.")
    except Exception as e:
        logger.error(f"Failed to send email via SMTP ({e}). Fallback console output:")
        logger.info("\n" + "="*60 +
                    f"\n[FALLBACK MOCK EMAIL SENT - SMTP FAILED: {e}]" +
                    f"\nTo: {to_email}" +
                    f"\nSubject: {subject}" +
                    f"\nBody: {text_body}" +
                    "\n" + "="*60 + "\n")

def send_otp_email(email: str, otp: str) -> None:
    """
    Sends a real SMTP transactional email with the 6-digit verification code.
    """
    subject = "Verify your QuantCoach AI Account"
    text_body = f"Welcome to QuantCoach AI!\n\nYour 6-digit verification code is: {otp}\n\nThis code will expire in 5 minutes."
    html_body = f"""
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; padding: 40px; color: #d1d5db; margin: 0;">
        <div style="max-width: 480px; margin: 0 auto; background: #171717; padding: 40px; border-radius: 16px; border: 1px solid #262626; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
          
          <!-- Brand Header -->
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 30px; text-align: center;">
            <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">QuantCoach AI</span>
          </div>
          
          <h2 style="color: #ffffff; margin-bottom: 12px; font-size: 22px; font-weight: 700; text-align: center;">Verify your email address</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #a3a3a3; text-align: center; margin-bottom: 30px;">
            Welcome to QuantCoach AI! Please enter the 6-digit verification code below to activate your trading journal account:
          </p>
          
          <!-- OTP Box -->
          <div style="background: #262626; border-radius: 12px; border: 1px solid #404040; padding: 18px; text-align: center; margin: 30px 0; letter-spacing: 6px; font-size: 36px; font-weight: 800; color: #a78bfa; font-family: monospace;">
            {otp}
          </div>
          
          <p style="font-size: 11px; color: #737373; line-height: 1.6; text-align: center;">
            This code will expire in 5 minutes. If you did not sign up for QuantCoach AI, you can safely ignore this email.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #262626; margin: 30px 0;">
          
          <p style="font-size: 10px; color: #525252; text-align: center; margin: 0;">
            &copy; {settings.PROJECT_NAME}. Secure transaction email delivery.
          </p>
        </div>
      </body>
    </html>
    """
    _send_smtp_email(email, subject, text_body, html_body)

def send_reset_password_email(email: str, otp: str) -> None:
    """
    Sends a real SMTP transactional email with the 6-digit password reset code.
    """
    subject = "Reset your QuantCoach AI Password"
    text_body = f"You requested a password reset.\n\nYour 6-digit reset code is: {otp}\n\nThis code will expire in 5 minutes."
    html_body = f"""
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0a0a0a; padding: 40px; color: #d1d5db; margin: 0;">
        <div style="max-width: 480px; margin: 0 auto; background: #171717; padding: 40px; border-radius: 16px; border: 1px solid #262626; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.3);">
          
          <!-- Brand Header -->
          <div style="display: flex; align-items: center; justify-content: center; margin-bottom: 30px; text-align: center;">
            <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">QuantCoach AI</span>
          </div>
          
          <h2 style="color: #ffffff; margin-bottom: 12px; font-size: 22px; font-weight: 700; text-align: center;">Reset your password</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #a3a3a3; text-align: center; margin-bottom: 30px;">
            You requested to reset your password. Please enter the 6-digit reset code below to authorize the change:
          </p>
          
          <!-- OTP Box -->
          <div style="background: #262626; border-radius: 12px; border: 1px solid #404040; padding: 18px; text-align: center; margin: 30px 0; letter-spacing: 6px; font-size: 36px; font-weight: 800; color: #f43f5e; font-family: monospace;">
            {otp}
          </div>
          
          <p style="font-size: 11px; color: #737373; line-height: 1.6; text-align: center;">
            This code will expire in 5 minutes. If you did not request a password reset, you can safely ignore this email and your account remains secure.
          </p>
          
          <hr style="border: 0; border-top: 1px solid #262626; margin: 30px 0;">
          
          <p style="font-size: 10px; color: #525252; text-align: center; margin: 0;">
            &copy; {settings.PROJECT_NAME}. Secure transaction email delivery.
          </p>
        </div>
      </body>
    </html>
    """
    _send_smtp_email(email, subject, text_body, html_body)
