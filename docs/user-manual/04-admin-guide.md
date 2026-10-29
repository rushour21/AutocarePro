# 4. Admin guide

The admin portal is for the owner or manager. Sign in as an admin to see the sidebar: **Dashboard, Jobs, Calendar, Customers, Vehicles, Estimates, Insurance Claims, Inventory, Team, Reports, Settings**.

## Dashboard (live workshop view)

The dashboard is built around a live map of the workshop.

- **Summary cards** at the top: **Active jobs**, **Awaiting approval** (with the rupee value waiting), **Due today**, and **Completed today**. Selecting a card opens the matching list.
- **Workshop view**: switch between **2D** and **3D**. Controls on the left let you pan, zoom in, zoom out, rotate, and go full screen. A **Live** label shows when the data was last updated.
- **Bay labels** show each bay's name and status (for example, "Bay 1, In Repair", "Bay 8, Available"). Colour shows the state at a glance.
- **Select a bay** to open its panel on the right: **Overview, Job Details, Timeline**, with **View Job** and **Update Status** buttons.
- **Today's Schedule** lists the day's jobs by time with their status. **View All** opens the full calendar.
- At the bottom: **Bay Status** counts (In Use, Available, Maintenance, Reserved), **Active Jobs** counts by stage, and **Quick Actions** (Add Job, Assign Bay, Inventory, View Reports).
- **New Job** and **View Settings** are at the top right.

The map shows the *published* layout. To change bays, see the [Workshop layout studio](08-workshop-layout.md).

## Jobs

- The Jobs page lists every job and offers a board with columns by stage (Inspection, In Repair, Diagnostics, Quality Check, Ready). Use the search and filters to find a job.
- **New Job** opens the [wizard](02-job-creation.md).
- Open a job to see its tabs: **Overview, Inspection, Tasks, Parts, Photos, Messages, History**, plus **Insurance** for insurance jobs.
- In the job header you can **Copy tracking link** (a private link for the customer), switch **Insurance job** on or off, and see the progress bar.
- **Update status** moves the job to another stage. Reassign the technician from the job page.

## Calendar

A weekly or monthly schedule of technicians' jobs. New jobs are placed in the technician's next free slot. Use Today, Week, Month and the arrows to move around.

## Customers and vehicles

- **Customers** lists customers with their phone, last service, and total spent. Open one to see their vehicles and history. A "follow-up" flag marks customers who need a call.
- **Vehicles** lists all vehicles. Use it to add a vehicle or check service due dates (for example, "Overdue by 6 days").

## Estimates

1. **Estimates, New estimate**: choose a job that has no estimate yet.
2. Edit the lines (item, category, amount, quantity) and write a short reason for the customer. **Save changes**.
3. Send the estimate to the customer. Its status moves from **Draft** to **Awaiting Approval**.
4. Track it in the list. Tabs filter by **All, Awaiting Approval, Approved, Rejected**.

## Inventory and parts requests

The Inventory area has three tabs: **Inventory** (stock), **Purchase Orders**, and **Suppliers**.

- **Add Part** adds an item. Low-stock items are highlighted.
- When a technician requests a part, a banner reads "N part requests are waiting for approval". Select **Review**, then **Approve** or **Reject**. Approving reduces the stock ("Approved and stock updated").
- **Purchase Orders** track orders to suppliers (Ordered, Delivered, Draft).

## Insurance Claims

A full section for cashless and reimbursement claims, with a **Receivables** tab showing what each insurer owes. See [Insurance claims](07-insurance-claims.md).

## Team

- **Team** lists staff with their role.
- **Technicians** shows each technician's workload.
- **Add Member** adds a person. Roles and permissions are shown in a separate tab.

## Reports

**Reports and Analytics** shows revenue and trend charts, jobs completed, new customers, and the service mix. Use the period selector (for example, last six months) to change the range.

## Settings

| Section | What it does |
|---|---|
| **Workshop** | Opens the layout studio to design bays and equipment |
| **Notifications** | Choose which alerts you receive |
| **Integrations** | Shows available integrations (some are "not available in this build") |
| **Subscription** | Plan details |
| **Data and Security** | Includes **Reset demo data** |

## Daily routine (suggested)

1. Open the **Dashboard** and check Due today, Awaiting approval, and any delayed jobs.
2. Review **parts requests** in Inventory and approve what is needed.
3. Send pending **estimates** and chase those **awaiting approval**.
4. Move finished jobs to **Ready** or **Completed**, and confirm payments.
5. Open **Insurance Claims, Receivables** to see which insurers are overdue.
