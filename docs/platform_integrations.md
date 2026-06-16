# Platform Integration Layer

Phase 5 includes safe connector scaffolds for future Instagram and YouTube integrations.

Current files:

- `automation/publishers/base_connector.mjs`
- `automation/publishers/instagram_publisher.mjs`
- `automation/publishers/youtube_publisher.mjs`

## Current Behavior

The connectors:

- Check whether expected environment variable names are configured.
- Validate package approval status.
- Generate local payload previews.
- Refuse to publish.

The connectors do not:

- Call Instagram, Meta, YouTube, Google, Canva, or third-party APIs.
- Store tokens.
- Upload media.
- Schedule live posts.
- Modify external accounts.

## Future Integration Rules

When live integrations are approved in a future phase:

- Keep platform modules separate.
- Use GitHub Secrets or deployment environment variables.
- Add token refresh handling.
- Add retry and error handling.
- Log success and failure without exposing secrets.
- Preserve the approval gate so nothing publishes from Draft or Ready status.
