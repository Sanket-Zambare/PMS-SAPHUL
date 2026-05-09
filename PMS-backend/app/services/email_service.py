import requests
import logging
import os

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://sane-sigma.vercel.app")
FROM_EMAIL = "Saphul PMS <onboarding@resend.dev>"


def _send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email using Resend HTTP API. Returns True if successful."""
    if not RESEND_API_KEY:
        logger.error("RESEND_API_KEY not set. Cannot send email.")
        return False

    try:
        response = requests.post(
            "https://api.resend.com/emails",
            headers={
                "Authorization": f"Bearer {RESEND_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "from": FROM_EMAIL,
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            },
            timeout=10,  # fail fast — no hanging
        )

        if response.status_code == 200 or response.status_code == 201:
            logger.info(f"Email sent successfully to {to_email}")
            return True
        else:
            logger.error(f"Resend API error {response.status_code}: {response.text}")
            return False

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


class EmailService:
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
        if not _send_email(user_email, subject, html_content):
            logger.warning(f"Signup confirmation email failed for {user_email}")

    def send_password_reset_email(self, user_email: str, reset_token: str, user_name: str) -> None:
        """Send password reset email with secure token."""
        subject = "Password Reset - Saphul PMS"
        reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"

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
        if not _send_email(user_email, subject, html_content):
            logger.warning(f"Password reset email failed for {user_email}")

    def send_invite_email(self, email: str, token: str, name: str) -> None:
        """Send client invitation email."""
        subject = "Invitation to join Saphul PMS"
        invite_url = f"{FRONTEND_URL}/accept-invite?token={token}"

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
        if not _send_email(email, subject, html_content):
            logger.warning(f"Invitation email failed for {email}")


# Global email service instance
email_service = EmailService()