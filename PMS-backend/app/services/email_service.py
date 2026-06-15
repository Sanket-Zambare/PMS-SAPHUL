import smtplib
import logging
import os
import asyncio
from concurrent.futures import ThreadPoolExecutor
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

_email_executor = ThreadPoolExecutor(max_workers=2)

logger = logging.getLogger(__name__)

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER")
SMTP_PASS = os.getenv("SMTP_PASS")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://sane-sigma.vercel.app")


def _send_email_sync(to_email: str, subject: str, html_content: str) -> bool:
    """Synchronous SMTP send — run in a thread, never in the event loop directly."""
    if not SMTP_USER or not SMTP_PASS:
        logger.error("SMTP_USER or SMTP_PASS not set. Cannot send email.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"Saphul PMS <{SMTP_FROM}>"
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
            server.sendmail(SMTP_USER, to_email, msg.as_string())

        logger.info(f"Email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


def _send_email(to_email: str, subject: str, html_content: str) -> bool:
    """Fire-and-forget email in a background thread. Never blocks the caller."""
    try:
        _email_executor.submit(_send_email_sync, to_email, subject, html_content)
        return True
    except Exception as e:
        logger.error(f"Failed to queue email to {to_email}: {str(e)}")
        return False


class EmailService:
    def send_signup_email(self, user_email: str, user_name: str) -> None:
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

    def send_task_assigned_email(self, user_email: str, user_name: str, task_title: str, task_id: int) -> None:
        subject = "You have been assigned a new task - Saphul PMS"
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
            <p>Best regards,<br>Saphul PMS Team</p>
        </body>
        </html>
        """
        if not _send_email(user_email, subject, html_content):
            logger.warning(f"Task assigned email failed for {user_email}")

    def send_task_approved_email(self, user_email: str, user_name: str, task_title: str, task_id: int) -> None:
        subject = "Your task has been approved - Saphul PMS"
        task_url = f"{FRONTEND_URL}/tasks/{task_id}"
        html_content = f"""
        <html>
        <body>
            <h2>Task Approved</h2>
            <p>Hello {user_name},</p>
            <p>Your task <strong>"{task_title}"</strong> has been approved.</p>
            <p><a href="{task_url}">View Task</a></p>
            <br>
            <p>Best regards,<br>Saphul PMS Team</p>
        </body>
        </html>
        """
        if not _send_email(user_email, subject, html_content):
            logger.warning(f"Task approved email failed for {user_email}")

    def send_task_rejected_email(self, user_email: str, user_name: str, task_title: str, task_id: int) -> None:
        subject = "Your task needs rework - Saphul PMS"
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
            <p>Best regards,<br>Saphul PMS Team</p>
        </body>
        </html>
        """
        if not _send_email(user_email, subject, html_content):
            logger.warning(f"Task rejected email failed for {user_email}")

    def send_invite_email(self, email: str, token: str, name: str) -> None:
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
