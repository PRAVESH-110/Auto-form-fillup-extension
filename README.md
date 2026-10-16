# Auto Form Filler (personal use)

A small Chrome extension for filling your recurring job application details from a profile saved on this device.

## Run it in Chrome

1. Open a terminal in the `chromeextension` folder.
2. Run `npm install` once, then `npm run build` whenever you update the extension.
3. In Chrome, open `chrome://extensions` and turn on **Developer mode**.
4. Choose **Load unpacked** and select `chromeextension/dist`.
5. Open a job application in a normal Chrome tab, click the extension icon, select your profile, and click **Fill**.

After changing code, run the build again and click the reload icon for the extension on `chrome://extensions`.

## Profile and privacy

Use **Load My Details** to start with the personal profile already in this project, review every field, then save it. The profile is stored in this Chrome installation with `chrome.storage.local`; this extension does not send it to a server. Anyone with access to your Chrome profile or computer can access browser-stored data, so do not use this as a password or highly sensitive information vault. Remove the extension or clear its data from Chrome's extension settings to remove the saved profile.

The Fill button skips fields that already contain a value, does not fill password or checkbox controls, and reports how many fields it filled. It handles common text fields, matching select options, and radio choices. Some application sites use unusual custom controls or block extension access; those fields may still need manual entry. Review the form before submitting it.
