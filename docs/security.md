# Security Notes

## Encryption

- Algorithm: AES-256-GCM
- IV: 12 bytes random per encryption
- Auth tag: 16 bytes
- DEK: 32-byte hex, wrapped by master KEK
- In-memory DEK cache TTL: 5 minutes (process-local; not suitable for serverless without redesign)

## AuthN / AuthZ

- Tokens: Supabase access JWT in `Authorization: Bearer`
- Web also mirrors tokens into cookies for middleware checks
- API validates via `supabaseAdmin.auth.getUser(token)`
- RLS policies exist in migrations but are not yet exercised by the Express service-role path

## Rate limits

- Redis-backed express-rate-limit stores
- Auth / register / API / chat / export buckets

## Account deletion

- Requires exact confirmation string
- Clears DEK cache
- Soft-deletes profile and nulls `encrypted_dek`
- Hard-deletes Auth user
- Keeps `audit_logs` for forensics
