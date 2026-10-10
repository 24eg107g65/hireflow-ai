import secrets

# Generate 32 cryptographically secure random bytes 
# and encode them directly into a Base64 string
token = secrets.token_urlsafe(32)

print(token)