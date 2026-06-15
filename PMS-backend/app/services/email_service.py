import requests
import logging
import os

logger = logging.getLogger(__name__)

BREVO_API_KEY = os.getenv("BREVO_API_KEY")
SENDER_EMAIL = os.getenv("SMTP_FROM", "sanketzambare17@gmail.com")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://sane-sigma.vercel.app")


def _send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Send email via Brevo HTTP API. Returns True if successful."""
    if not BREVO_API_KEY:
        logger.error("BREVO_API_KEY not set. Cannot send email.")
        return False

    try:
        response = requests.post(
            "https://api.brevo.com/v3/smtp/email",
            headers={
                "api-key": BREVO_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "sender": {"name": "SANE PMS", "email": SENDER_EMAIL},
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": html_content,
            },
            timeout=10,
        )
        if response.status_code in (200, 201):
            logger.info(f"Email sent successfully to {to_email}")
            return True
        else:
            logger.error(f"Brevo API error {response.status_code}: {response.text}")
            return False
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


class EmailService:
    def send_signup_email(self, user_email: str, user_name: str) -> None:
        subject = "Welcome to SANE PMS"
        html_content = f"""
        <html>
        <body>
            <h2>Welcome to SANE PMS, {user_name}!</h2>
            <p>Your account has been successfully created.</p>
            <p>You can now log in and start managing your projects.</p>
            <br>
            <p>Best regards,<br>SANE Team</p>
        </body>
        </html>
        """
        if not _send_email(user_email, subject, html_content):
            logger.warning(f"Signup confirmation email failed for {user_email}")

    def send_password_reset_email(self, user_email: str, reset_token: str, user_name: str) -> None:
        subject = "Password Reset - SANE PMS"
        reset_url = f"{FRONTEND_URL}/reset-password?token={reset_token}"
        html_content = f"""
        <html>
        <body>
            <h2>Password Reset Request</h2>
            <p>Hello {user_name},</p>
            <p>You requested a password reset for your SANE PMS account.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="{reset_url}">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <br>
            <p>Best regards,<br>SANE Team</p>
        </body>
        </html>
        """
        if not _send_email(user_email, subject, html_content):
            logger.warning(f"Password reset email failed for {user_email}")

    def send_task_assigned_email(self, user_email: str, user_name: str, task_title: str, task_id: int) -> None:
        subject = "You have been assigned a new task - SANE PMS"
        task_url = f"{FRONTEND_URL}/tasks/{task_id}"
        html_content = f"""
        <html>
        <body>
            <h2>New Task Assigned</h2>
            <p>Hello {user_name},</p>
            <p>You have been assigned to the following task:</p>
            <p><strong>{task_title}</strong></p>
            <p><a href="{task_url}">View Task</a></p>
            <br>
            <p>Best regards,<br>SANE Team</p>
        </body>
        </html>
        """
        if not _send_email(user_email, subject, html_content):
            logger.warning(f"Task assigned email failed for {user_email}")

    def send_task_approved_email(self, user_email: str, user_name: str, task_title: str, task_id: int) -> None:
        subject = "Your task has been approved - SANE PMS"
        task_url = f"{FRONTEND_URL}/tasks/{task_id}"
        html_content = f"""
        <html>
        <body>
            <h2>Task Approved</h2>
            <p>Hello {user_name},</p>
            <p>Your task <strong>"{task_title}"</strong> has been approved.</p>
            <p><a href="{task_url}">View Task</a></p>
            <br>
            <p>Best regards,<br>SANE Team</p>
        </body>
        </html>
        """
        if not _send_email(user_email, subject, html_content):
            logger.warning(f"Task approved email failed for {user_email}")

    def send_task_rejected_email(self, user_email: str, user_name: str, task_title: str, task_id: int) -> None:
        subject = "Your task needs rework - SANE PMS"
        task_url = f"{FRONTEND_URL}/tasks/{task_id}"
        html_content = f"""
        <html>
        <body>
            <h2>Task Rejected</h2>
            <p>Hello {user_name},</p>
            <p>Your task <strong>"{task_title}"</strong> has been rejected and needs rework.</p>
            <p>Please review the task and make the necessary changes.</p>
            <p><a href="{task_url}">View Task</a></p>
            <br>
            <p>Best regards,<br>SANE Team</p>
        </body>
        </html>
        """
        if not _send_email(user_email, subject, html_content):
            logger.warning(f"Task rejected email failed for {user_email}")

    def send_invite_email(self, email: str, token: str, name: str) -> None:
        subject = "Invitation to join SANE PMS"
        invite_url = f"{FRONTEND_URL}/accept-invite?token={token}"
        html_content = f"""
        <html>
        <body>
            <h2>You're invited to join SANE PMS</h2>
            <p>Hello,</p>
            <p>{name} has invited you to join SANE PMS.</p>
            <p>Click the link below to accept the invitation:</p>
            <p><a href="{invite_url}">Accept Invitation</a></p>
            <p>This invitation will expire in 7 days.</p>
            <br>
            <p>Best regards,<br>SANE Team</p>
        </body>
        </html>
        """
        if not _send_email(email, subject, html_content):
            logger.warning(f"Invitation email failed for {email}")


# Global email service instance
email_service = EmailService()
