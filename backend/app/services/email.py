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
    verification_link = f"http://localhost:4200/verify-email?token={token}"
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