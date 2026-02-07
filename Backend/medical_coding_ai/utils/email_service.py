"""
Email Service for Panaceon Platform
Handles sending activation emails, password reset emails, and other notifications
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env from Backend directory
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(env_path)

import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)

# Email configuration from environment variables
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '465'))  # 465 for SSL, 587 for STARTTLS
SMTP_USE_SSL = os.getenv('SMTP_USE_SSL', 'true').lower() == 'true'  # Use SSL by default
SMTP_USER = os.getenv('SMTP_USER', '')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
SMTP_FROM_EMAIL = os.getenv('SMTP_FROM_EMAIL', 'noreply@panaceon.com')
SMTP_FROM_NAME = os.getenv('SMTP_FROM_NAME', 'Panaceon Platform')
FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:3000')

# Log email config for debugging (without password)
logger.info(f"Email config: host={SMTP_HOST}, port={SMTP_PORT}, ssl={SMTP_USE_SSL}, user={SMTP_USER}")


async def send_email(
    to_email: str,
    subject: str,
    html_content: str,
    text_content: Optional[str] = None
) -> bool:
    """
    Send an email using SMTP

    Args:
        to_email: Recipient email address
        subject: Email subject
        html_content: HTML content of the email
        text_content: Plain text content (optional fallback)

    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Create message
        message = MIMEMultipart('alternative')
        message['From'] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
        message['To'] = to_email
        message['Subject'] = subject

        # Add text and HTML parts
        if text_content:
            text_part = MIMEText(text_content, 'plain')
            message.attach(text_part)

        html_part = MIMEText(html_content, 'html')
        message.attach(html_part)

        # Send email via SMTP
        # Use SSL on port 465 (Gmail default) or STARTTLS on port 587
        async with aiosmtplib.SMTP(
            hostname=SMTP_HOST, 
            port=SMTP_PORT,
            use_tls=SMTP_USE_SSL  # True for port 465 (SSL), False for port 587 (STARTTLS)
        ) as smtp:
            if not SMTP_USE_SSL:
                await smtp.starttls()  # Only needed for port 587
            await smtp.login(SMTP_USER, SMTP_PASSWORD)
            await smtp.send_message(message)

        logger.info(f"Email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {str(e)}")
        return False


async def send_activation_email(
    to_email: str,
    username: str,
    activation_link: str
) -> bool:
    """
    Send account activation email with 48-hour valid link

    Args:
        to_email: User's email address
        username: User's username
        activation_link: Full activation URL with token

    Returns:
        bool: True if email sent successfully
    """
    subject = "Activate Your Panaceon Account"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #0066cc;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
                border-radius: 0 0 5px 5px;
            }}
            .button {{
                display: inline-block;
                background-color: #0066cc;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
            }}
            .warning {{
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                padding: 10px;
                margin: 15px 0;
                border-radius: 3px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Welcome to Panaceon</h1>
        </div>
        <div class="content">
            <h2>Hello {username},</h2>
            <p>Thank you for joining Panaceon, the AI-powered medical coding and billing platform.</p>

            <p>To complete your registration and activate your account, please click the button below:</p>

            <center>
                <a href="{activation_link}" class="button">Activate My Account</a>
            </center>

            <div class="warning">
                <strong>⏰ Important:</strong> This activation link is valid for 48 hours only.
                After that, you'll need to request a new activation email.
            </div>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="background-color: #f0f0f0; padding: 10px; word-break: break-all;">
                {activation_link}
            </p>

            <p>If you didn't create an account with Panaceon, please ignore this email.</p>

            <div class="footer">
                <p><strong>Panaceon</strong> - HIPAA-Compliant Medical Coding Platform</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"""
    Welcome to Panaceon, {username}!

    To activate your account, please visit this link (valid for 48 hours):
    {activation_link}

    If you didn't create an account with Panaceon, please ignore this email.

    ---
    Panaceon - HIPAA-Compliant Medical Coding Platform
    """

    return await send_email(to_email, subject, html_content, text_content)


async def send_password_reset_email(
    to_email: str,
    username: str,
    reset_link: str
) -> bool:
    """
    Send password reset email with 4-hour valid link

    Args:
        to_email: User's email address
        username: User's username
        reset_link: Full password reset URL with token

    Returns:
        bool: True if email sent successfully
    """
    subject = "Reset Your Panaceon Password"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #0066cc;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
                border-radius: 0 0 5px 5px;
            }}
            .button {{
                display: inline-block;
                background-color: #0066cc;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .footer {{
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
            }}
            .warning {{
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                padding: 10px;
                margin: 15px 0;
                border-radius: 3px;
            }}
            .security-note {{
                background-color: #d1ecf1;
                border: 1px solid #0c5460;
                padding: 10px;
                margin: 15px 0;
                border-radius: 3px;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Password Reset Request</h1>
        </div>
        <div class="content">
            <h2>Hello {username},</h2>
            <p>We received a request to reset your Panaceon account password.</p>
            <p>To reset your password, click the button below:</p>

            <center>
                <a href="{reset_link}" class="button">Reset My Password</a>
            </center>

            <div class="warning">
                <strong>⏰ Important:</strong> This password reset link is valid for 4 hours only.
                After that, you'll need to request a new password reset.
            </div>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="background-color: #f0f0f0; padding: 10px; word-break: break-all;">
                {reset_link}
            </p>

            <div class="security-note">
                <strong>🔒 Security Note:</strong> If you didn't request this password reset,
                please ignore this email or contact support if you have concerns about your account security.
            </div>

            <div class="footer">
                <p><strong>Panaceon</strong> - HIPAA-Compliant Medical Coding Platform</p>
                <p>This is an automated message. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"""
    Password Reset Request for {username}

    We received a request to reset your Panaceon account password.

    To reset your password, visit this link (valid for 4 hours):
    {reset_link}

    If you didn't request this password reset, please ignore this email.

    ---
    Panaceon - HIPAA-Compliant Medical Coding Platform
    """

    return await send_email(to_email, subject, html_content, text_content)


async def send_welcome_email(
    to_email: str,
    username: str,
    first_name: str
) -> bool:
    """
    Send welcome email after account activation

    Args:
        to_email: User's email address
        username: User's username
        first_name: User's first name

    Returns:
        bool: True if email sent successfully
    """
    subject = "Welcome to Panaceon - Your Account is Active!"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
            }}
            .header {{
                background-color: #28a745;
                color: white;
                padding: 20px;
                text-align: center;
                border-radius: 5px 5px 0 0;
            }}
            .content {{
                background-color: #f9f9f9;
                padding: 30px;
                border: 1px solid #ddd;
                border-radius: 0 0 5px 5px;
            }}
            .button {{
                display: inline-block;
                background-color: #0066cc;
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
            }}
            .features {{
                background-color: white;
                padding: 15px;
                margin: 15px 0;
                border-left: 4px solid #0066cc;
            }}
            .footer {{
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid #ddd;
                font-size: 12px;
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>✓ Account Activated Successfully!</h1>
        </div>
        <div class="content">
            <h2>Welcome aboard, {first_name}!</h2>
            <p>Your Panaceon account has been successfully activated and you're ready to start.</p>

            <div class="features">
                <h3>What you can do with Panaceon:</h3>
                <ul>
                    <li>✓ AI-powered medical code suggestions (ICD-10, CPT, HCPCS)</li>
                    <li>✓ Automated claims processing and tracking</li>
                    <li>✓ Denial management and appeals</li>
                    <li>✓ Comprehensive analytics and reporting</li>
                    <li>✓ HIPAA-compliant data handling</li>
                </ul>
            </div>

            <center>
                <a href="{FRONTEND_URL}/login" class="button">Login to Your Account</a>
            </center>

            <p>Your username is: <strong>{username}</strong></p>

            <p>Need help getting started? Check out our documentation or contact support.</p>

            <div class="footer">
                <p><strong>Panaceon</strong> - HIPAA-Compliant Medical Coding Platform</p>
                <p>Questions? Contact our support team</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"""
    Welcome to Panaceon, {first_name}!

    Your account has been successfully activated.
    Username: {username}

    Login at: {FRONTEND_URL}/login

    What you can do with Panaceon:
    - AI-powered medical code suggestions
    - Automated claims processing
    - Denial management and appeals
    - Comprehensive analytics and reporting

    ---
    Panaceon - HIPAA-Compliant Medical Coding Platform
    """

    return await send_email(to_email, subject, html_content, text_content)
