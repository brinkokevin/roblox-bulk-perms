# Chrome Web Store submission

Everything to paste into the [Chrome Web Store developer dashboard](https://chrome.google.com/webstore/devconsole).
Upload `roblox-bulk-perms.zip` from the latest GitHub release (manifest.json is at the zip's root, as the store requires).

## Store listing tab

**Description**

```
Creating a Roblox Open Cloud API key means picking every permission one dropdown at a time. This extension adds a "Bulk add permissions" box to the Create API Key page on create.roblox.com: paste a list, click Apply, and every matching permission is selected for you.

What you can paste (one per line, or separated by commas or spaces):
• universe-datastores.objects:read (one operation, the same text the permission chips show)
• universe.secret (every operation of a scope)
• memory-stores (a whole API system, as named in the dropdown)
• * (everything)

"Copy current" copies the permissions already selected on the form as a list you can paste next time.

You stay in control: the extension only fills in the permission dropdowns. You still name the key and click "Save & Generate Key" yourself, and the extension never reads, stores or sends the generated key.

Needs no extension permissions and runs only on create.roblox.com/dashboard. Open source: https://github.com/brinkokevin/roblox-bulk-perms

Not affiliated with or endorsed by Roblox Corporation.
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
Selects multiple permissions at once on the Roblox Create API Key page, from a list the user pastes.
```

**Host permission justification** (for the content script on create.roblox.com/dashboard/*)

```
The extension's only function is adding a paste box to the Create API Key form on create.roblox.com/dashboard and selecting the permissions the user lists there. It runs on no other site.
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
