# Security Policy

## Reporting

Do not open public issues for vulnerabilities. Contact the maintainers or school administrators through the configured private security channel.

## Security expectations

- Invitations are personal and non-transferable.
- Student identifiers and application details are private.
- Admin actions must be written to audit logs.
- Access control must be enforced both in the frontend and backend.
- Secrets must not be committed to the repository.

## Production checklist

- Use SSO / OAuth with school identity provider.
- Rotate JWT/session secrets.
- Configure HTTPS-only cookies.
- Enable database backups.
- Restrict admin routes to trusted roles.
- Configure rate limiting on application submission.
