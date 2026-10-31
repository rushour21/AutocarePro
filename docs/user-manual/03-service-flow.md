# 3. Service flow

This document follows one job from arrival to delivery, and says who does what at every step.

## The stages

| Stage | Meaning | Usually moved by |
|---|---|---|
| **Pending** | Job created, waiting to start | Admin (creates) |
| **Inspection** | Technician is inspecting the vehicle | Technician |
| **Diagnostics** | Finding the cause and what work is needed | Technician |
| **In Repair** | Approved work is being done | Technician (or automatically when the customer approves an estimate) |
| **Quality Check** | Work is done and being checked | Technician |
| **Ready** | Ready for the customer to collect | Technician or admin |
| **Completed** | Vehicle delivered | Admin |

Progress is shown as a percentage on the job. Moving a job to **Ready** sets it to 100%.

## Step by step

### 1. Booking or walk-in
- A customer can **book a service** in the customer portal (see [Customer guide](06-customer-guide.md)), or the front desk creates the job directly. The booking is created with status **Requested**, and the workshop then creates the job when the customer arrives.
- Admin creates the job with the [wizard](02-job-creation.md).

### 2. Check-in and inspection
- The vehicle is checked in with its condition recorded (step 3 of the wizard).
- The assigned technician opens the job under **My Jobs**, then **Inspections**, and marks findings on the car diagram, adds photos, and writes notes. See [Technician guide](05-technician-guide.md).
- The job moves to **Inspection**, then **Diagnostics**.

### 3. Estimate and approval
1. The admin creates an estimate for the job: **Estimates, New estimate**, pick the job, edit the lines, **Save changes**, and send it to the customer. Estimate status is **Draft**, then **Awaiting Approval**.
2. The customer is notified and opens the estimate in the portal or the private link. They can **Approve Estimate** (confirmation dialog: "Approve this estimate?") or **Request Changes**.
3. When approved, the estimate becomes **Approved** and, if the job was still in Pending, Inspection or Diagnostics, it moves to **In Repair**. If it is rejected, the workshop follows up with the customer.

The estimate total is the sum of the lines plus 18% GST.

### 4. Repair
- The technician works through the job's tasks and checklist (**Update Progress**) and adds notes and photos.
- If a part is needed, the technician sends a **parts request**. The admin approves or rejects it in **Inventory**. Approving updates the stock. See [Admin guide](04-admin-guide.md).
- Extra work found during the repair needs a new or updated estimate and fresh customer approval before the work is done.

### 5. Quality check and ready
- The technician moves the job to **Quality Check** and then to **Ready**.
- The customer sees "Your vehicle is ready" on the tracking link and in the portal.

### 6. Delivery and payment
1. The admin moves the job to **Completed**. This frees the bay, records the completion date, and raises an **invoice** (status **Pending**) for the approved estimate total.
2. The customer opens **Invoices**, selects the invoice, and chooses **Pay** (UPI in the demo). The invoice becomes **Paid** and a "Payment received" notification is created.
3. The customer can leave a **star rating and comment** on the feedback page once the vehicle is ready.

## Who sees what, and when

| Event | Admin | Technician | Customer |
|---|---|---|---|
| Job created | Dashboard, Jobs board | My Jobs | Dashboard, tracking link |
| Estimate sent | Estimates (Awaiting Approval) | Not shown | Notification, Estimates |
| Estimate approved | Estimates (Approved), job In Repair | Job moves to In Repair | Status updates |
| Parts requested | Inventory banner "waiting for approval" | My Requests | Not shown |
| Ready | Dashboard bay status | Job list | "Your vehicle is ready" |
| Completed and paid | Invoices and reports | Job history | Invoice marked Paid |

## Delays and holds

- A job whose promised date has passed shows as **delayed** on the dashboard.
- A job flagged **On Hold** appears under the On Hold filter in My Jobs.
