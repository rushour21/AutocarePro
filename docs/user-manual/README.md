# AutoHub User Manual

AutoHub is a workshop (garage) management web app with three portals that share one set of data:

| Portal | Who uses it | What it is for |
|---|---|---|
| **Admin** | Workshop owner or manager | Run the whole workshop: jobs, customers, estimates, insurance claims, inventory, team, reports, layout |
| **Technician** | Mechanics and service staff | See assigned jobs, inspect cars, update status, request parts |
| **Customer** | Vehicle owners | Track a car, approve estimates, pay, book services, follow insurance claims |

Customers can also follow a car without signing in, through a **private tracking link**.

> **Demo note.** This build is a front-end demo. Everything (jobs, customers, claims) is mock data stored in the browser. Nothing is sent to a server, and messages such as "link sent on WhatsApp" are simulated. See [FAQ and troubleshooting](09-faq-troubleshooting.md).

## Documents

| # | Document | Read it when you want to |
|---|---|---|
| 1 | [Getting started](01-getting-started.md) | Sign in, understand roles, and find your way around |
| 2 | [Job creation](02-job-creation.md) | Create a new job (five-step wizard) |
| 3 | [Service flow](03-service-flow.md) | Follow a job from check-in to delivery and payment |
| 4 | [Admin guide](04-admin-guide.md) | Use every admin screen (dashboard, jobs, estimates, inventory, reports) |
| 5 | [Technician guide](05-technician-guide.md) | Work jobs, inspect cars, request parts |
| 6 | [Customer guide](06-customer-guide.md) | Use the customer portal and the private tracking link |
| 7 | [Insurance claims](07-insurance-claims.md) | Handle cashless and reimbursement claims end to end |
| 8 | [Workshop layout studio](08-workshop-layout.md) | Design bays and equipment and publish the 3D workshop |
| 9 | [FAQ and troubleshooting](09-faq-troubleshooting.md) | Fix common problems, reset demo data |

## The whole process on one page

1. **Customer books** a service (or the front desk creates the job directly). See [Job creation](02-job-creation.md).
2. **Admin creates the job**: vehicle, service, check-in inspection, estimate, review. A technician is assigned.
3. **Technician inspects** the car, marks damage, and sends findings. See [Technician guide](05-technician-guide.md).
4. **Admin sends an estimate.** The **customer approves** it in the portal or through the private link. See [Service flow](03-service-flow.md).
5. **Technician repairs**, requests parts if needed (admin approves), and moves the job to Quality Check, then Ready.
6. **Delivery**: the job is marked Completed, an invoice is raised, and the **customer pays** and leaves a review.
7. **Insurance jobs** follow the same path with an extra claim track: documents, claim pack, surveyor, customer share, insurer payment. See [Insurance claims](07-insurance-claims.md).

## Terms used in this manual

- **Job**: one piece of work on one vehicle (for example, Brake Service on a Toyota Fortuner). Job numbers look like `J1004`.
- **Stage**: where the job is: Pending, Inspection, Diagnostics, In Repair, Quality Check, Ready, Completed.
- **Bay**: a physical working position in the workshop (with or without a lift).
- **Estimate**: the quote (parts and labour, plus 18% GST) the customer must approve.
- **Tracking link**: a private web address that shows one job to the customer without signing in.
- **Claim**: an insurance claim attached to a job.
