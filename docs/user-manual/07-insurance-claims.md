# 7. Insurance claims

Insurance jobs often run on paper, WhatsApp, and memory: documents go missing, surveyors take time, customers are surprised by their share at delivery, and the workshop loses track of what each insurer owes. The **Insurance Claims** section keeps all of that in one place.

> **Demo note.** The module is front-end only. "Send upload link to customer" and the claim pack are simulated, and the surveyor link works in the same browser. Reference timelines are illustrative (see section 9).

## 1. The claim lifecycle

Every claim has a status. Cashless claims use all twelve; reimbursement claims skip **DO Received**.

| # | Status | Meaning |
|---|---|---|
| 1 | **Intimated** | Claim reported to the insurer |
| 2 | **Docs Pending** | Waiting for customer documents |
| 3 | **Estimate Ready** | Documents in and an estimate prepared |
| 4 | **Survey Scheduled** | Claim pack sent, surveyor assigned |
| 5 | **Surveyed** | Survey done |
| 6 | **Approved** | Insurer approved the amount |
| 7 | **In Repair** | Repair under way |
| 8 | **Re-inspection** | Surveyor re-checks the repair |
| 9 | **DO Received** | Delivery Order received from the insurer (cashless only) |
| 10 | **Delivered** | Car handed back |
| 11 | **Payment Pending** | Insurer has not paid yet |
| 12 | **Settled** | Insurer payment received |

Status moves forward automatically at some steps (see each section below), and an admin can also set it by hand from the **Claim status** selector.

## 2. Start a claim

1. Open the job (**Jobs, select the job**).
2. In the job header, switch **Insurance job** on.
3. An **Insurance** tab appears on the job, and a claim is created with status **Intimated**. If the job already had an estimate, its lines are copied into the claim.

You can also reach every claim from **Insurance Claims** in the sidebar.

## 3. The claims list

**Insurance Claims** has two tabs: **Claims** and **Receivables**.
- **Search** by claim, car, customer, or job.
- Filter by **insurer** and by **status**.
- Columns: **Job no., Car, Customer, Insurer, Claim no., Type (Cashless or Reimbursement), Status, Days open**. A red **Overdue** badge appears when a reference timeline has been missed.
- Select a row to open the claim. On a phone the list shows cards instead of a table.

## 4. Claim details

On the claim, fill in:
- **Claim type**: Cashless or Reimbursement.
- **Insurer** (for example, ABC General Insurance).
- **Accident date**, **Policy no.**, **Claim no.**
- **Surveyor name** and **phone**. Setting a surveyor records when the surveyor was allocated.

Changes save immediately.

## 5. Documents checklist

| Document | Required |
|---|---|
| Insurance policy | Yes |
| Registration certificate (RC) | Yes |
| Driving licence | Yes |
| Signed claim form | Yes |
| FIR | Optional |

- Select **Mark uploaded** when a document arrives (or **Undo**).
- **Send upload link to customer** records that a link was sent and moves the claim to **Docs Pending** if needed. (In the demo this is a simulated message.)
- When every required document is uploaded and the claim has estimate lines, the claim moves to **Estimate Ready**.

## 6. Photos checklist

Photos are grouped by stage. Tap a missing slot to mark it uploaded (a placeholder image is used in the demo), or tap an uploaded photo to remove it.

| Stage | Slots |
|---|---|
| **Intake** | Front, Rear, Left side, Right side, Damage close-up 1, Damage close-up 2, Odometer, Chassis no. |
| **Old parts** | Replaced parts, Damaged panel (removed) |
| **Final** | Front (after repair), Repaired area, Odometer (delivery) |

## 7. Estimate split (who pays what)

List every repair line. For each line choose **Insurance covers** or **Customer pays** by tapping the label. **Add line** adds an item (name, amount, and type: Part, Labour, or Paint).

Set these per claim (nothing is hard-coded):
- **Compulsory deductible (₹)**: for example, ₹1,000 for cars up to 1500cc and ₹2,000 above. Check your policy.
- **Depreciation on parts (%)**: applied to covered **parts** only.
- **Zero-dep policy**: switch on to skip depreciation.

The summary card shows:

| Line | How it is calculated |
|---|---|
| Estimate total | Sum of all lines |
| Not covered by insurance | Lines marked Customer pays |
| Depreciation | Covered parts x depreciation %, or ₹0 for zero-dep |
| Compulsory deductible | The deductible you entered (never more than the covered amount) |
| **Insurance pays** | Covered lines minus depreciation minus deductible (never below zero) |
| **Customer pays** | Estimate total minus Insurance pays |

Example: a claim with ₹54,650 of lines, ₹2,400 not covered, ₹12,200 of covered parts at 25% depreciation, and a ₹1,000 deductible: depreciation is ₹3,050, **Insurance pays ₹48,200**, **Customer pays ₹6,450**.

## 8. Claim pack and surveyor

1. When the required documents and estimate lines are in place, **Generate claim pack** becomes available. (If it is greyed out, the note beside it says what is missing.)
2. Select it. After a short wait you see **Claim pack ready**, with a preview of the pack (photos, documents, estimate, and the insurer and customer amounts).
3. Generating the pack sends it "to the surveyor", records the time, and moves the claim to **Survey Scheduled**.
4. **Copy surveyor link** (or **Open surveyor view**) gives the surveyor a read-only page, with no login.

**The surveyor page** (`/surveyor/claim/<claim number>`) shows the car and owner, photos, documents, and the estimate (including the amount claimed from the insurer). The surveyor enters **Remarks** and the **Approved amount**, then selects **Submit assessment**. The claim becomes **Approved** with that amount recorded.

## 9. Timelines and Overdue badges

The claim shows three reference timelines:

| Check | Reference limit |
|---|---|
| Surveyor allocated | Within 24 hours of the claim being reported |
| Survey report | Within 15 days of the surveyor being allocated |
| Insurer decision | Within 7 days of the survey report |

Each shows **On time**, **In time**, **Late** (done, but after the limit), or **Overdue** (not done and past the limit). The claim's **Claim timeline** lists every event with its date and time.

> These limits are illustrative defaults. Confirm the exact figures against the current insurance regulator rules before relying on them. They can be changed in one place in the code (`SLA` in `lib/insurance.ts`).

## 10. Customer approval of their share

The customer opens their job in the portal (or follows the notification "Insurance claim: approve your share"). The **Insurance claim** card shows **Insurance pays**, **You pay**, and the breakdown (repair estimate, items not covered, depreciation, deductible).
- Select **Approve** to confirm. The card shows "Approved on" with the time.
- The admin sees "Customer approved their share" on the claim. Until then the claim shows a warning that approval is pending.

Get this approval **before delivery** so there are no surprises at the counter.

## 11. After the repair

1. Update the claim status as the job progresses: **In Repair, Re-inspection, DO Received** (cashless), **Delivered**.
2. Raise the invoice to the insurer and set **Payment Pending** if payment has not arrived.

## 12. Receivables: what each insurer owes

Open **Insurance Claims, Receivables**.
- The header reads, for example, **₹3.2L pending · 8 claims · oldest 41 days**.
- **By insurer**: pending amount, number of claims, oldest pending (days), and **short-paid** amounts.
- **Claims awaiting payment**: each claim with its status and pending amount.

An insurer owes money from **Approved** until **Settled**. The expected amount is the surveyor's approved amount, or the calculated insurance share if none was entered.

**Record a payment**
1. When the car is **Delivered** (or Payment Pending), select **Mark payment received** next to the claim.
2. The amount is pre-filled with the pending amount. Enter a lower figure if the insurer paid less.
3. Select **Record payment**. The claim becomes **Settled**, and any shortfall is counted as **short-paid** for that insurer.

## 13. End-to-end checklist

- [ ] Mark the job as an insurance job and enter the claim details.
- [ ] Collect all required documents and the intake photos.
- [ ] Build the estimate and set who pays each line, deductible, and depreciation.
- [ ] Generate the claim pack and send the surveyor link.
- [ ] Get the surveyor's approved amount.
- [ ] Get the customer's approval of their share.
- [ ] Repair, take final photos, and deliver.
- [ ] Record the insurer's payment and note any short payment.
