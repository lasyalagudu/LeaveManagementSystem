import asyncio
from aiosmtplib import send
from email.mime.text import MIMEText

async def test_email():
    msg = MIMEText("Test email from FastAPI")
    msg["From"] = "lasyalagudu@gmail.com"
    msg["To"] = "lasyalagudu@gmail.com"
    msg["Subject"] = "SMTP Test"
    
    await send(
        msg,
        hostname="smtp.gmail.com",
        port=587,
        username="lasyalagudu@gmail.com",
        password="",
        start_tls=True
    )

asyncio.run(test_email())
