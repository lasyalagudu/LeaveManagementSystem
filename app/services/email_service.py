import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import logging
from app.config import settings
from app.models.user import User  # ✅ add this import
class EmailService:
    def __init__(self):
        self.smtp_host = settings.smtp_host
        self.smtp_port = settings.smtp_port
        self.smtp_username = settings.smtp_username
        self.smtp_password = settings.smtp_password
        self.from_email = settings.email_from 
        self.from_name = "HR Team"  # Make sure this is set

    async def send_email(self, to_email: str, subject: str, html_content: str, text_content: str = None):
        """Send email using SMTP"""
        try:
            message = MIMEMultipart("alternative")
            message["From"] = f"{self.from_name} <{self.from_email}>"
            message["To"] = to_email
            message["Subject"] = subject

            if text_content:
                message.attach(MIMEText(text_content, "plain"))
            message.attach(MIMEText(html_content, "html"))

            await aiosmtplib.send(
                message,
                hostname=self.smtp_host,
                port=self.smtp_port,
                username=self.smtp_username,
                password=self.smtp_password,
                start_tls=True  # use TLS for port 587
            )
            logger.info(f"Email sent successfully to {to_email}: {subject}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {e}")
            return False

    async def send_welcome_email(self, user: User, temp_password: str):
        """Send welcome email to new employee with auto-generated password"""
        subject = "Welcome to Our Company - Your Account Details"

        html_content = f"""
        <html>
        <body>
            <h2>Welcome to Our Company!</h2>
            <p>Hello {user.first_name},</p>
            <p>Your account has been created successfully.</p>
            <p><strong>Temporary Password:</strong> {temp_password}</p>
            <p>Use this password to log in and change it after your first login.</p>
            <br>
            <p>Best regards,<br>HR Team</p>
        </body>
        </html>
        """

        text_content = f"""
        Welcome to Our Company!

        Hello {user.first_name},

        Your account has been created successfully.

        Temporary Password: {temp_password}

        Use this password to log in and change it after your first login.

        Best regards,
        HR Team
        """

        # Send email asynchronously
        try:
        # Await directly
            await self.send_email(user.email, subject, html_content, text_content)
        except Exception as e:
            logger.error(f"Failed to send welcome email: {e}")
