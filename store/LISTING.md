# Chrome Web Store submission

Everything to paste into the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole).
Upload `roblox-bulk-perms.zip` from the latest GitHub release (manifest.json is at the zip's root, as the store requires).

## Store listing tab

**Description**

```
Paste a list of permissions on Roblox's Create API Key page and select them all at once.

Open source: https://github.com/brinkokevin/roblox-bulk-perms
Not affiliated with Roblox.
```

**Category:** Developer Tools
**Language:** English
**Store icon:** `icons/icon128.png`
**Screenshot:** `store/screenshot-1280x800.png`
**Small promo tile:** `store/promo-440x280.png`
**Homepage URL:** https://github.com/brinkokevin/roblox-bulk-perms
**Support URL:** https://github.com/brinkokevin/roblox-bulk-perms/issues

## Privacy practices tab

**Single purpose**

```
Selects multiple permissions at once on the Roblox Create API Key page.
```

**Host permission justification** (for the content script on create.roblox.com/dashboard/*)

```
Adds a paste box to the Create API Key form on create.roblox.com/dashboard. Runs on no other site.
```

**Are you using remote code?** No, I am not using remote code.
(The extension reads one public JSON file, Roblox's scope list at apis.roblox.com/cloud-authentication/v1/scopes, without cookies. That's data, not code.)

**Data usage:** tick none of the data types. Then tick all three certifications:
- I do not sell or transfer user data to third parties, outside of the approved use cases
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:** https://github.com/brinkokevin/roblox-bulk-perms#what-it-does-and-doesnt-do

## Distribution tab

Free, Public, all regions.
