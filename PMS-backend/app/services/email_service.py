import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from typing import Optional

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.smtp_host = os.getenv('SMTP_HOST')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_user = os.getenv('SMTP_USER')
        self.smtp_pass = os.getenv('SMTP_PASS')
        self.smtp_from = os.getenv('SMTP_FROM')

        # Validate required SMTP settings
        if not all([self.smtp_host, self.smtp_user, self.smtp_pass, self.smtp_from]):
            logger.warning("SMTP configuration incomplete. Email sending will be disabled.")

    def _send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send email using SMTP. Returns True if successful, False otherwise."""
        if not all([self.smtp_host, self.smtp_user, self.smtp_pass, self.smtp_from]):
            logger.error("SMTP configuration incomplete. Cannot send email.")
            return False

        try:
            # Create message
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.smtp_from
            msg['To'] = to_email

            # Add HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)

            # Send email
            server = smtplib.SMTP(self.smtp_host, self.smtp_port)
            server.starttls()
            server.login(self.smtp_user, self.smtp_pass)
            server.sendmail(self.smtp_from, to_email, msg.as_string())
            server.quit()

            logger.info(f"Email sent successfully to {to_email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

    def send_signup_email(self, user_email: str, user_name: str) -> None:
        """Send signup confirmation email."""
        subject = "Welcome to Saphul PMS"
        html_content = f"""
        <html>
        <body>
            <h2>Welcome to Saphul PMS, {user_name}!</h2>
            <p>Your account has been successfully created.</p>
            <p>You can now log in and start managing your projects.</p>
            <br>
            <p>Best regards,<br>Saphul PMS Team</p>
        </body>
        </html>
        """

        # Best-effort: log failure but don't raise exception
        if not self._send_email(user_email, subject, html_content):
            logger.warning(f"Signup confirmation email failed for {user_email}")

    def send_password_reset_email(self, user_email: str, reset_token: str, user_name: str) -> None:
        """Send password reset email with secure token."""
        subject = "Password Reset - Saphul PMS"
        # =========================
        # ==== PRODUCTION (HOSTINGER) ====
        # Uncomment this for production deployment
        # Frontend: https://app.yourdomain.com
        # =========================
        # PRODUCTION reset URL (uncomment and set your production frontend URL):
        # frontend_url = os.getenv("FRONTEND_URL", "https://app.yourdomain.com")
        # reset_url = f"{frontend_url}/reset-password?token={reset_token}"
        
        # =========================
        # ==== LOCAL (REMOVE FOR PROD) ====
        # REMOVE OR COMMENT THIS FOR PRODUCTION
        # =========================
        reset_url = f"http://localhost:3000/reset-password?token={reset_token}"  # LOCAL ONLY - development frontend URL

        html_content = f"""
        <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>Hello {user_name},</p>
            <p>You requested a password reset for your Saphul PMS account.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="{reset_url}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <br>
            <p>Best regards,<br>Saphul PMS Team</p>
        </body>
        </html>
        """

        # Best-effort: log failure but don't raise exception
        if not self._send_email(user_email, subject, html_content):
            logger.warning(f"Password reset email failed for {user_email}")

    def send_invite_email(self, email: str, token: str, name: str) -> None:
        """Send client invitation email."""
        subject = "Invitation to join Saphul PMS"
        # =========================
        # ==== PRODUCTION (HOSTINGER) ====
        # Uncomment this for production deployment
        # Frontend: https://app.yourdomain.com
        # =========================
        # PRODUCTION invite URL (uncomment and set your production frontend URL):
        # frontend_url = os.getenv("FRONTEND_URL", "https://app.yourdomain.com")
        # invite_url = f"{frontend_url}/accept-invite?token={token}"
        
        # =========================
        # ==== LOCAL (REMOVE FOR PROD) ====
        # REMOVE OR COMMENT THIS FOR PRODUCTION
        # =========================
        invite_url = f"http://localhost:3000/accept-invite?token={token}"  # LOCAL ONLY - development frontend URL

        html_content = f"""
        <html>
        <body>
            <h2>You're invited to join Saphul PMS</h2>
            <p>Hello,</p>
            <p>{name} has invited you to join Saphul PMS.</p>
            <p>Click the link below to accept the invitation:</p>
            <p><a href="{invite_url}">Accept Invitation</a></p>
            <p>This invitation will expire in 7 days.</p>
            <br>
            <p>Best regards,<br>Saphul PMS Team</p>
        </body>
        </html>
        """

        # Best-effort: log failure but don't raise exception
        if not self._send_email(email, subject, html_content):
            logger.warning(f"Invitation email failed for {email}")

# Global email service instance
email_service = EmailService()
