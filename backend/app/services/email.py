
import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from app.config import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("QuantCoachEmailService")


def _send_smtp_email(
    to_email: str,
    subject: str,
    text_body: str,
    html_body: str
) -> None:

    # Never silently skip email delivery in production
    if not settings.EMAILS_ENABLED:
        raise RuntimeError("Email service is disabled.")

    if not settings.SMTP_USER or not settings.SMTP_PASSWORD:
        raise RuntimeError("SMTP credentials are missing.")

    smtp_user = settings.SMTP_USER.strip()
    smtp_pass = settings.SMTP_PASSWORD.replace(" ", "").strip()
    smtp_host = settings.SMTP_HOST.strip()
    smtp_port = int(settings.SMTP_PORT)

    # Gmail requires authenticated sender address
    if "gmail" in smtp_host.lower():
        sender = smtp_user
    else:
        sender = settings.SMTP_FROM or smtp_user

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.PROJECT_NAME} <{sender}>"
    msg["To"] = to_email

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        logger.info(
            "Connecting to SMTP host=%s port=%s",
            smtp_host,
            smtp_port
        )

        if smtp_port == 465:
            # SSL connection
            with smtplib.SMTP_SSL(
                smtp_host,
                smtp_port,
                timeout=20
            ) as server:

                server.login(smtp_user, smtp_pass)
                server.sendmail(
                    sender,
                    [to_email],
                    msg.as_string()
                )

        elif smtp_port == 587:
            # STARTTLS connection
            with smtplib.SMTP(
                smtp_host,
                smtp_port,
                timeout=20
            ) as server:

                server.ehlo()
                server.starttls()
                server.ehlo()

                server.login(smtp_user, smtp_pass)

                server.sendmail(
                    sender,
                    [to_email],
                    msg.as_string()
                )

        else:
            raise ValueError(
                f"Unsupported SMTP port: {smtp_port}. "
                "Use 465 or 587."
            )

        logger.info(
            "Email successfully accepted by SMTP server. "
            "Recipient: %s, Subject: %s",
            to_email,
            subject
        )

    except Exception:
        logger.exception(
            "EMAIL DELIVERY FAILED for recipient: %s",
            to_email
        )
        raise


def send_otp_email(email: str, otp: str) -> None:
    subject = "Verify your QuantCoach AI Account"

    text_body = (
        f"Welcome to QuantCoach AI!\n\n"
        f"Your 6-digit verification code is: {otp}\n\n"
        f"This code will expire in 5 minutes."
    )

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif;
                   background-color: #0a0a0a;
                   padding: 40px; color: #d1d5db;">
        <div style="max-width: 480px; margin: auto;
                    background: #171717; padding: 40px;
                    border-radius: 16px;">
          <h2 style="color: white; text-align: center;">
            Verify your email address
          </h2>

          <p style="text-align: center; color: #a3a3a3;">
            Welcome to QuantCoach AI!
            Enter the verification code below.
          </p>

          <div style="background: #262626;
                      padding: 18px;
                      text-align: center;
                      letter-spacing: 6px;
                      font-size: 36px;
                      font-weight: bold;
                      color: #a78bfa;">
            {otp}
          </div>

          <p style="text-align: center; color: #737373;">
            This code expires in 5 minutes.
          </p>

          <p style="text-align: center; color: #525252;">
            &copy; {settings.PROJECT_NAME}
          </p>
        </div>
      </body>
    </html>
    """

    _send_smtp_email(email, subject, text_body, html_body)


def send_reset_password_email(email: str, otp: str) -> None:
    subject = "Reset your QuantCoach AI Password"

    text_body = (
        f"You requested a password reset.\n\n"
        f"Your 6-digit reset code is: {otp}\n\n"
        f"This code will expire in 5 minutes."
    )

    html_body = f"""
    <html>
      <body style="font-family: Arial, sans-serif;
                   background-color: #0a0a0a;
                   padding: 40px; color: #d1d5db;">
        <div style="max-width: 480px; margin: auto;
                    background: #171717; padding: 40px;
                    border-radius: 16px;">
          <h2 style="color: white; text-align: center;">
            Reset your password
          </h2>

          <p style="text-align: center; color: #a3a3a3;">
            Enter the password reset code below.
          </p>

          <div style="background: #262626;
                      padding: 18px;
                      text-align: center;
                      letter-spacing: 6px;
                      font-size: 36px;
                      font-weight: bold;
                      color: #f43f5e;">
            {otp}
          </div>

          <p style="text-align: center; color: #737373;">
            This code expires in 5 minutes.
          </p>

          <p style="text-align: center; color: #525252;">
            &copy; {settings.PROJECT_NAME}
          </p>
        </div>
      </body>
    </html>
    """

    _send_smtp_email(email, subject, text_body, html_body)
