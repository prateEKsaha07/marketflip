import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

print("=" * 60)
print("Environment Variables Test")
print("=" * 60)

# Get values
supabase_url = os.getenv("SUPABASE_URL")
supabase_anon = os.getenv("SUPABASE_ANON_KEY")
supabase_service = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

print(f"Original SUPABASE_URL: {supabase_url}")

# Clean URL for testing
if supabase_url:
    cleaned_url = supabase_url.rstrip('/')
    if cleaned_url.endswith('/rest/v1'):
        cleaned_url = cleaned_url[:-8]
    elif '/rest/v1' in cleaned_url:
        cleaned_url = cleaned_url.split('/rest/v1')[0]
    print(f"Cleaned SUPABASE_URL: {cleaned_url}")

print(f"SUPABASE_ANON_KEY: {supabase_anon[:30] if supabase_anon else 'MISSING'}...")
print(f"SUPABASE_SERVICE_ROLE_KEY: {supabase_service[:30] if supabase_service else 'MISSING'}...")

if supabase_url and supabase_anon and supabase_service:
    print("\n✅ All environment variables are set correctly!")
else:
    print("\n❌ Some environment variables are missing")

print("=" * 60)