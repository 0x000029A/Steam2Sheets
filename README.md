# Steam2Sheets
Add your favorite games on Steam to a Google Sheets.
Using Google Apps Script, its Web App deployment, IGDB API, and any userscript manager.

## How to use?
1. Install a userscript manager.
2. Add the userscript to it.
3. Create a sheet on Google Sheets.
4. Add Apps Script to it.
5. Copy Code.gs to your Code.gs
6. Edit `oauthScopes` in appsscript.json to the following:
```
 "oauthScopes": [
    "https://www.googleapis.com/auth/script.external_request",
    "https://www.googleapis.com/auth/spreadsheets"
  ],
```
