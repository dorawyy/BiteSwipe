## Setup Instructions

1. **Update Authentication Credentials**
   - Modify `local.properties` file to include a current `WEB_TOKEN_ID` value
   - Note: Token sharing is restricted for security purposes

2. **Configure SSL Certificate**
   - Place the `server.crt` certificate file in the following directory:
     `<repo_root>/frontend/app/src/main/res/raw/`

3. **Important: Google Play Services Version**
   - **Watch for outdated Google Play Services warnings**
   - To fix this issue, update the version in `gradle/libs.versions.toml` to a more recent version
   - Look for the relevant dependencies in the libraries section and update their version numbers
   
4. **Configure Application Signing**
   - Execute `gradle signingreport` in terminal
   - Provide the generated SHA1 fingerprint to the project administrator for authorization

5. **Reset Development Environment**
   - Navigate to File → Invalidate Cache
   - Select all options
   - Click "Invalidate and Restart"
6. **Enjoy!**