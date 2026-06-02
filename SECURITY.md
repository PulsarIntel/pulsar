# Security Policy

## Reporting a Vulnerability

Please do not open public issues for security vulnerabilities.

Email security reports to:

```text
ege@chele.bi
```

Include:

- A clear description of the issue.
- Steps to reproduce.
- Impact and affected component, if known.
- Any relevant logs, screenshots, or proof of concept.

I will acknowledge reports as soon as possible and prioritize fixes based on severity.

## Scope

Security-sensitive areas include:

- Authentication and JWT handling.
- WebSocket authorization and subscription handling.
- Portfolio and transaction data.
- Market-data provider credentials.
- Backend API endpoints.
- Deployment and environment configuration.

## Responsible Disclosure

Please give maintainers reasonable time to investigate and patch before public disclosure. I appreciate coordinated disclosure and will credit reporters when requested.

## Secrets

Do not commit API keys, `.env` files, tokens, database credentials, SSH keys, or production service credentials. If you believe a secret was exposed, report it immediately using the process above.
