import random
import string

def generate_verification_code() -> str:
    """Generate a 4-digit numeric verification code"""
    return ''.join(random.choices(string.digits, k=4))