import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from ..config import settings


def send_verification_email(email: str, token: str):
    # Configuration de l'email
    sender_email = settings.SMTP_USERNAME
    sender_password = settings.SMTP_PASSWORD
    smtp_server = settings.SMTP_SERVER
    smtp_port = settings.SMTP_PORT

    # Création du message
    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = email
    message["Subject"] = "Vérification de votre adresse email"

    # Corps du message
    verification_link = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    body = f"""
    Bonjour,

    Merci de vous être inscrit. Pour vérifier votre adresse email, veuillez cliquer sur le lien suivant :

    {verification_link}

    Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.

    Cordialement,
    L'équipe de Tracking App
    """
    message.attach(MIMEText(body, "plain"))

    try:
        # Connexion au serveur SMTP
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)

        # Envoi de l'email
        server.send_message(message)
        server.quit()
        return True
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email: {str(e)}")
        return False


def send_password_reset_email(email: str, token: str) -> bool:
    """Send a password reset email with the given token."""
    sender_email = settings.SMTP_USERNAME
    sender_password = settings.SMTP_PASSWORD
    smtp_server = settings.SMTP_SERVER
    smtp_port = settings.SMTP_PORT

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = email
    message["Subject"] = "Réinitialisation de votre mot de passe"

    reset_link = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    body = (
        "Bonjour,\n\n"
        "Vous avez demandé la réinitialisation de votre mot de passe. "
        "Pour définir un nouveau mot de passe, veuillez cliquer sur le "
        "lien suivant :\n\n"
        f"{reset_link}\n\n"
        "Si vous n'avez pas demandé cette réinitialisation, vous pouvez "
        "ignorer cet email.\n\n"
        "Cordialement,\n"
        "L'équipe de Tracking App"
    )
    message.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(message)
        server.quit()
        return True
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email: {str(e)}")
        return False


def send_tracking_update_email(email: str, tracking_number: str, status: str) -> bool:
    """Send a simple tracking update email."""
    sender_email = settings.SMTP_USERNAME
    sender_password = settings.SMTP_PASSWORD
    smtp_server = settings.SMTP_SERVER
    smtp_port = settings.SMTP_PORT

    message = MIMEMultipart()
    message["From"] = sender_email
    message["To"] = email
    message["Subject"] = f"Update for {tracking_number}"

    body = f"Status for package {tracking_number}: {status}"
    message.attach(MIMEText(body, "plain"))

    try:
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(sender_email, sender_password)
        server.send_message(message)
        server.quit()
        return True
    except Exception as e:
        print(f"Erreur lors de l'envoi de l'email: {str(e)}")
        return False


def send_sms(phone: str, message: str) -> bool:
    """Dummy SMS sender for alerts."""
    try:
        print(f"Sending SMS to {phone}: {message}")
        return True
    except Exception as e:
        print(f"Erreur lors de l'envoi du SMS: {str(e)}")
        return False
