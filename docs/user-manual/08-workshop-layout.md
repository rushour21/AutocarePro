# 8. Workshop layout studio

The layout studio lets an admin draw the real workshop (bays, equipment, reception, parts storage) in metres. The result is shown in the **Workshop Live View** on the dashboard, in 2D and in 3D.

Open it from **Settings, Workshop**. Only admins can use it.

## What you can design

| Item | Details |
|---|---|
| **Workshop size** | Width and length in metres, wall height, and grid spacing |
| **Bays** | A name, a type, a size (width and length), rotation (0 or 90 degrees), whether it is active, and its condition: normal, maintenance, or reserved |
| **Bay types** | General Service, Inspection, Diagnostics, Tyre Service, Quality Check, Detailing and PPF, Wash Area |
| **Equipment** (per bay) | Two-post lift, Diagnostic tools, Tool cabinet, Wheel balancer, Tyre changer, Air compressor |
| **Fixtures** | Reception desk, Parts storage, Customer lounge, Tool cabinet, Entrance |

Occupancy (which car is in which bay) is never typed in. It comes from the jobs assigned to each bay.

## Using the studio

1. **Workshop Dimensions**: set width, length, wall height, and grid spacing.
2. **Tools** (left panel):
   - **Add Bay** and **Add Equipment** place new items on the plan.
   - **Select** picks an item to edit. **Move** drags it (or use the arrow keys for small steps).
   - **Zoom in / Zoom out** change the view.
   - **Undo / Redo** step backwards and forwards through your changes.
   - **Snap to grid** keeps items aligned.
3. **Edit the selected item** in the right panel: name, type, size, rotation, active, state, and equipment.
4. Switch between **2D Floor Plan** and **3D Preview** (top right) to see the result.

If the floor is full when you add a bay, the workshop is lengthened automatically.

## Checks the studio makes

- Bays and fixtures cannot overlap, and must stay inside the walls.
- A bay that has an active job cannot simply be deleted. Move or finish the job first.
- Problems are shown beside the item so you can fix them before publishing.

## Draft, discard, publish

| Button | What it does |
|---|---|
| **Save Draft** | Keeps your edits without changing the live workshop |
| **Discard** | Throws the draft away and returns to the published layout |
| **Publish Layout** | Makes the draft the live layout. The dashboard map updates immediately |

The page shows which version is published and whether you have unpublished edits. Publishing a layout where an occupied bay was removed is blocked until the conflict is resolved.

## Optional: custom 3D models

By default the 3D workshop is generated from the plan. To use your own models (lifts, cabinets, and so on), place `.glb` files in `public/models/` and list them in `public/models/manifest.json`. Items without a model fall back to the built-in shapes.

## Tips

- Draw the real measurements. A bay is usually about 4.5 m wide and 7 m long.
- Leave a clear drive aisle (about 3 m) so the 3D view looks like the real workshop.
- Publish when the physical workshop changes (a new bay, a lift in maintenance).
