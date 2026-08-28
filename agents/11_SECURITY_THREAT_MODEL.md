# SECURITY THREAT MODEL

## 1. Assets
Protect:
- account credentials
- session tokens
- customer data
- seller business data
- order/payment records
- media
- admin operations
- API secrets

## 2. Primary Threats
### Account takeover
Mitigation:
- secure auth
- rate limits
- MFA where appropriate
- session revocation
- suspicious-login controls

### Broken authorization
Every seller resource access checks ownership.

Example:
Seller A must never update Seller B's product by changing an ID in the URL.

### Payment tampering
Never trust client amount/status. Server calculates commercial values and verifies provider events.

### Inventory race
Use DB atomicity/locking/reservations.

### Malicious uploads
Validate files and isolate FFmpeg workers.

### XSS
Escape/render untrusted content safely.

### SQL injection
Parameterized queries/ORM.

### SSRF
Do not fetch arbitrary user URLs server-side without allowlisting and network controls.

### Abuse/spam
Rate limits, moderation, report flows.

### Admin abuse
MFA + RBAC + audit.

## 3. Security Definition of Done
A critical feature is not done until:
- authentication reviewed
- authorization reviewed
- input validation reviewed
- rate limit considered
- sensitive logging reviewed
- threat model updated where needed
- tests include unauthorized access
