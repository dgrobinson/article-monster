# iOS Share Sheet Integration Concept

## Goal
Enable sending the current page from the iOS share menu directly into the Article Monster service without needing the desktop bookmarklet workflow.

## Recommended Approach: iOS Shortcuts Share Sheet
Apple's Shortcuts app can add custom actions to the system share sheet. A shortcut can accept the shared URL and forward it to the Article Monster service using an authenticated HTTPS request.

### High-Level Flow
1. **Trigger** – User taps the share button in Safari (or any app that shares URLs) and chooses the custom shortcut.
2. **Shortcut Processing**
   - Receive the shared URL as input.
   - Retrieve the user's Article Monster service base URL from Shortcut variables.
   - Perform a `POST` request to the service endpoint that queues article processing (e.g., `/process-article`).
   - Include any required authentication tokens or API keys stored securely in the Shortcut (e.g., Ask Each Time, Keychain, or environment variables via iCloud).
3. **Server Handling** – Article Monster backend processes the URL similar to how the bookmarklet submits extraction jobs, sending results to Kindle/Zotero.
4. **User Feedback** – Shortcut can show success/failure notification based on HTTP response.

### Implementation Steps
1. **Expose a Mobile-Friendly Endpoint**
   - Confirm the server already accepts raw URLs via `POST /process-article` (bookmarklet endpoint).
   - Optionally add a lightweight alias like `POST /queue-article` that returns JSON status only (no HTML redirect), making it simpler to parse from Shortcuts.
2. **Create the Shortcut**
   - In Shortcuts app, create a new shortcut with the "Share Sheet" toggle enabled under Details.
   - Add `Get Details of Safari Web Page` (or `Get URLs from Input`) to capture the URL.
   - Use `Text` action to construct a JSON payload `{ "url": "{{Shortcut Input}}" }`.
   - Add `Get Contents of URL` action configured as:
     - Method: POST
     - URL: `https://your-article-monster.example/process-article`
     - Headers: `Content-Type: application/json`
     - Request Body: the JSON text from the previous step
   - Add `Show Result` action to display the response or a custom success message.
3. **Authentication Considerations**
   - If the endpoint requires authentication, configure headers for API keys or tokens.
   - For Gmail/Zotero credentials, nothing extra is needed; those remain server-side.
4. **Testing**
   - Share an article from Safari and confirm the shortcut triggers processing.
   - Verify Kindle/Zotero receive the article as expected.
5. **Distribution**
   - Export the shortcut as a shareable link for reuse by other team members.

### Optional Enhancements
- Add parameters for Kindle-only or Zotero-only routing via query strings or JSON flags.
- Provide haptic or spoken feedback on success/failure.
- Log shortcut invocations on the server for troubleshooting.

## Why Not a Native App Extension Right Now?
- **Development Overhead** – Building and maintaining a Swift share extension requires Xcode, signing certificates, and App Store/TestFlight distribution.
- **Shortcut Coverage** – Shortcuts already integrates into the share sheet with minimal setup and can be updated by users without App Store releases.
- **Server Parity** – The same backend endpoint used by the bookmarklet can serve mobile Shortcuts, avoiding new infrastructure.

If future requirements demand deeper integration (offline queueing, background processing, richer UI), a dedicated iOS app with a share extension could be explored. For now, the Shortcut approach provides a native-feeling share menu entry with low implementation cost.
