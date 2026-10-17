# AutoCare Pro — Frontend

Next.js 15 (App Router) + TypeScript + Tailwind CSS implementation of the AutoCare Pro
garage-management designs: **Admin Portal**, **Employee Portal** and **Customer Tracking**.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
npm run build && npm start
```

## Routes

| Portal | Route | Design screen |
| --- | --- | --- |
| Landing | `/` | Portal picker |
| Admin | `/admin` | Dashboard |
| | `/admin/job-cards` | Job Cards |
| | `/admin/job-cards/new` | Create New Job Card |
| | `/admin/job-cards/[id]` | Job Card – Overview |
| | `/admin/job-cards/[id]/inspection` | Vehicle Inspection (2D, plus 3D view) |
| | `/admin/job-cards/[id]/estimate` | Estimate & Approval |
| | `/admin/job-cards/[id]/work-progress` | Work Progress |
| | `/admin/job-cards/[id]/parts-labour`, `/admin/inventory` | Parts & Inventory |
| | `/admin/invoices` | Invoices & Payments |
| | `/admin/reports` | Reports |
| Employee | `/employee` | My Jobs – Dashboard |
| | `/employee/jobs/new` | Create Job Card – Steps 1–4 (step 3 has 2D and full 3D inspection) |
| | `/employee/jobs/[id]` | Job Details |
| | `/employee/jobs/[id]/work-progress` | Update Work Progress |
| | `/employee/parts-request`, `/employee/jobs/[id]/parts` | Parts Request |
| | `/employee/jobs/[id]/photos` | Photo Gallery |
| | `/employee/service-history` | Service History |
| Customer | `/track/G-1024-a8f7xk9` | Tracking Overview (desktop; mobile layout below 768px) |
| | `/track/[code]/inspection` | Vehicle Inspection – Damage Diagram |
| | `/track/[code]/estimate` | Estimate & Approval |
| | `/track/[code]/progress` | Service Progress & Photos |
| | `/track/[code]/invoice` | Invoice & Payment |
| | `/track/[code]/summary` | Service Summary (Completed) |

## Structure

- `lib/data.ts` — all mock data (jobs, estimates, timelines, damage points). Swap for API calls.
- `components/ui.tsx` — status pills, cards, avatars, vertical timeline, horizontal stepper.
- `components/inspection/` — 2D damage diagram with live markers + Selected Area panel, and the 3D viewer
  (rotate / pan / zoom by dragging, auto-rotate, click-to-add damage points, angle presets).
- `components/{admin,employee,customer}/` — portal shells (sidebars, headers, tabs) and shared sections.
- `public/assets/` — imagery extracted from the design sheets (vehicle renders, diagrams, damage photos, avatars).

## Notes

- Images are crops of the supplied design sheets, upscaled 3×; replace them with original exports for full sharpness.
- The 3D view is a 2.5D treatment of the supplied render (perspective rotate/zoom/pan), not a real 3D model.
  Swap `components/inspection/Viewer3D.tsx`'s image for a three.js / model-viewer scene when a car model is available.
- Sidebar sections without a design (Customers, Vehicles, Employees, Estimates, Settings, Profile) render a simple placeholder.
