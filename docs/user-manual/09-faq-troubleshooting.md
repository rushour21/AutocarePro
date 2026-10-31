# 9. FAQ and troubleshooting

## About the demo

**Is my data saved?**
Changes are saved in your browser only. They are not sent to a server, so they are not shared between devices or people.

**How do I get back to the starting data?**
Admin: **Settings, Data and Security, Reset demo data**. You can also clear the site's data in your browser.

**Why do dates look old (March 2025)?**
The demo treats Monday 16 March 2025 as today so that "due today", "days open", and similar counters stay consistent.

**Are WhatsApp messages, PDFs, and payments real?**
No. "Link sent on WhatsApp", the claim pack PDF preview, and UPI payment are simulations for the demo.

**Does the AI assistant exist?**
Not in this build.

## Sign in and access

| Problem | What to do |
|---|---|
| I cannot sign in | Check the email and password in [Getting started](01-getting-started.md). Passwords are case-sensitive |
| A page sends me back to my home screen | Your role does not have access to that page |
| A customer cannot see a job | Customers see only their own vehicles. Share the tracking link instead |

## Jobs and estimates

| Problem | What to do |
|---|---|
| **Next** is disabled in the new-job wizard | A required field (marked *) is empty, or the registration number format is wrong (use a plate like `MH12AB1234`) |
| The job does not appear in Calendar | It appears in the technician's next free slot. Check the right technician and week |
| An estimate is stuck on Awaiting Approval | Share the tracking link again or call the customer. Approval can be done from the link or the portal |
| Stock did not change after a parts request | Stock changes when the admin **approves** the request in Inventory |

## Insurance

| Problem | What to do |
|---|---|
| **Generate claim pack** is greyed out | Upload every required document and make sure the claim has at least one estimate line |
| The surveyor link says "Claim not found" | The demo stores data per browser. Open the link in the same browser, or use a build with a real back end |
| **Mark payment received** is disabled | It is available once the car is **Delivered** or **Payment Pending** |
| The Overdue badges look wrong | They use reference limits (24 hours, 15 days, 7 days). Check them against the current rules and adjust in `lib/insurance.ts` |

## Display

| Problem | What to do |
|---|---|
| The 3D workshop is blank | Your browser may have 3D (WebGL) turned off. Turn on hardware acceleration or try another browser. The 2D view still works |
| Text is too small on a phone | Use the browser's page zoom. All screens are designed for phone width |
| The layout looks stale after changes | Refresh the page. Layout changes appear after **Publish Layout** |

## Running and deploying the app

- Install and start: `npm install`, then `npm run dev` (development) or `npm run build` then `npm start` (production).
- New features such as Insurance Claims appear on the live site only after the branch that contains them is merged and deployed.
- The promotional videos and their source are in `media/reels/` and `video/`. They are not needed to run the app.

## Getting help

Describe what you were doing, which role you were signed in as, and what you expected to happen. A screenshot of the screen helps.
