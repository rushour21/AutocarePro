# 1. Getting started

## Signing in

1. Open the app and go to **Login**.
2. Enter an email and password and sign in. You land on the home screen for your role.

Demo accounts (mock data):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@autohub.com` | `admin123` |
| Technician | `amit@autohub.com` (also `priya@`, `karan@`, `nilesh@`, `rohit@autohub.com`) | `tech123` |
| Customer | `rahul.mehta@example.com` | `customer123` |

Use **Sign out** from the profile menu (top right) to switch accounts.

## What each role can see

| | Admin | Technician | Customer |
|---|---|---|---|
| Jobs | All jobs | Only jobs assigned to them | Only their own vehicles' jobs |
| Estimates | All | Those on their jobs | Their own |
| Invoices | All | None | Their own |
| Inventory and parts approval | Yes | Request only | No |
| Insurance claims | Full management | No | Their own share approval |
| Team, reports, settings, layout | Yes | No | No |

If you open a page you are not allowed to see, you are returned to your own home screen.

## Finding your way around

**Admin** sidebar: Dashboard, Jobs, Calendar, Customers, Vehicles, Estimates, Insurance Claims, Inventory, Team, Reports, Settings.

**Technician** menu: Dashboard, My Jobs, Inspections, Parts Request, Calendar, Messages, Team, Profile.

**Customer** menu: Dashboard, My Vehicles, Bookings, Estimates, Invoices, Service History, Notifications, Share Link, Support (and Profile).

On a phone the sidebar becomes a menu button (top left), and the customer and technician portals also show a bottom bar with the main sections. Every screen is designed to work at phone width.

## The demo calendar

The demo treats **Monday 16 March 2025** as "today". Dates such as "Due today" and the claim "days open" counters are calculated from that date.

## Where your data lives

All changes are saved in your browser (local storage). That means:
- Changes made on one device are not visible on another.
- Clearing site data resets the demo.
- An admin can restore the starting data with **Settings, Data & Security, Reset demo data**.
