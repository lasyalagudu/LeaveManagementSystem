from passlib.context import CryptContext
plain_password = "User@123"

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed_password = pwd_context.hash(plain_password)
print(hashed_password)