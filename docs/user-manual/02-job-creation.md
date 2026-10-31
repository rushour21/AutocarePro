# 2. Job creation

Admins (and front-desk staff) create jobs with the **Create New Job** wizard. Open it from **Jobs, New Job** or the **New Job** button on the dashboard. The wizard has five steps, shown at the top: **Vehicle, Service, Inspection, Estimate, Review**. You can go back to any earlier step.

## Step 1. Vehicle

Find the car, or add a new customer and car.

**Search an existing vehicle** (three tabs):
- **By Number**: type the registration number (for example `MH12AB1234`) and search.
- **By Customer**: type the customer's name.
- **Recent Vehicles** are listed below the search for a quick pick. Tap one to select it.

When a vehicle is selected, **Vehicle Details** appears on the right or below, with the owner and odometer.

**New Vehicle** (car or owner not in the system):
1. Choose **Quick pick** for a common model, or fill in the fields.
2. Owner: **Full name** and **Phone** are required. Email is optional. Or pick an existing **Customer**.
3. Vehicle: **Make**, **Model**, **Registration number**, **Odometer (km)** are required. **Variant**, **Fuel**, and **Year** are optional.
4. Continue with **Next**.

Registration numbers must look like a normal Indian plate, for example `MH12AB1234`.

## Step 2. Service

1. Choose a **Service type**: General Service, Brake Service, Engine Service, AC Service, Suspension, Diagnostics, Detailing, Body Repair, or Custom Request.
2. Set **Priority** (High, Medium, Low).
3. Pick the **Promised delivery**: Today, Tomorrow, In 2 days, In 3 days, or In 5 days.
4. **Assign technician** from the list.
5. Write the **Customer complaint / notes** (what the customer reported).

Choosing a service pre-fills typical estimate lines for step 4 (for example, Brake Service adds a front brake pad and brake labour).

## Step 3. Inspection (check-in)

Record the condition of the car when it arrives.
1. Tap the points on the car diagram to mark damage. Each point can be **Good**, **Minor**, **Major**, or **Not Checked**. For a flagged point, choose the damage type and add notes.
2. Set the **Fuel level**.
3. Add **Other notes** (for example, "customer left a spare key").

This protects the workshop and the customer: it is the record of the car's condition at drop-off.

## Step 4. Estimate

Build the quote.
1. Review the lines created from the service type.
2. Edit **Item**, **Type** (Parts, Labour, and so on), and **Amount**, or **Remove line**.
3. Add more lines if needed.

GST (18%) is added automatically to the subtotal.

## Step 5. Review and create

1. Check the vehicle, service, technician, flagged areas, and estimate.
2. Select **Create Job**.

The job is created in the **Pending** stage and given the next job number (for example `J1031`). It appears on the dashboard, on the Jobs board, in the technician's list, and in the **Calendar** and **Today's Schedule** (in the technician's next free time slot). A private **tracking link** is generated for the customer.

## After creation

- Open the job from the **Jobs** page to copy the **tracking link** and send it to the customer.
- If the work is an insurance job, switch on **Insurance job** in the job header. See [Insurance claims](07-insurance-claims.md).
- Continue with the [Service flow](03-service-flow.md).

## Common mistakes

| Problem | Fix |
|---|---|
| "Next" is disabled | A required field (marked *) is empty or the registration number format is wrong |
| Car already exists | Search by number first and select it instead of adding a new vehicle |
| Wrong technician | Open the job later and reassign it from the job page |
