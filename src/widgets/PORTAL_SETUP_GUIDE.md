# CMDB Health Doctor — Service Portal Setup Guide

This guide walks you through creating the portal in ServiceNow after running
`npm run build && npm run deploy`. All widgets are already deployed to your
instance. You just need to wire them into a portal page using the ServiceNow UI.

---

## Prerequisites

- `npm run deploy` completed successfully (both widgets are now on the instance)
- You are logged into `https://epamsvsdemo3.service-now.com` as an admin

---

## Step 1 — Create the Portal Theme

The portal needs a dark theme so it does not clash with the widget's dark CSS.

1. In the ServiceNow navigator, search for **Service Portal > Themes**
2. Click **New**
3. Fill in:

   | Field | Value |
   |---|---|
   | Name | `CMDB Health Dark` |

4. Scroll down to the **CSS Variables** field and paste this:

   ```
   @navbar-default-bg:         #0d0d1a;
   @navbar-default-color:      #e8eaf6;
   @navbar-default-link-color: #9fa8da;
   @body-bg:                   #0d0d1a;
   @text-color:                #e8eaf6;
   @link-color:                #4fc3f7;
   @btn-default-bg:            #16213e;
   @btn-default-color:         #e8eaf6;
   @btn-default-border:        rgba(255,255,255,0.1);
   @panel-bg:                  #1a1a2e;
   @panel-border-color:        rgba(255,255,255,0.06);
   @input-bg:                  #0d1525;
   @input-color:               #e8eaf6;
   @input-border:              rgba(255,255,255,0.12);
   @dropdown-bg:               #16213e;
   @dropdown-link-color:       #9fa8da;
   @dropdown-link-hover-bg:    #0f3460;
   ```

5. Click **Save**

---

## Step 2 — Create the Portal Record

1. In the navigator, search for **Service Portal > Portals**
2. Click **New**
3. Fill in:

   | Field | Value |
   |---|---|
   | Title | `CMDB Health Doctor` |
   | URL Suffix | `cmdbhealthportal` |
   | Default Theme | `CMDB Health Dark` ← the theme you just created |
   | Login page | `login` |

4. Leave **Homepage** blank for now (you will set it after creating the page)
5. Click **Save**

---

## Step 3 — Create the Portal Page

1. In the navigator, search for **Service Portal > Pages**
2. Click **New**
3. Fill in:

   | Field | Value |
   |---|---|
   | Title | `CMDB Health Home` |
   | ID | `cmdb_health_home` |

   > **Important:** The ID must be exactly `cmdb_health_home` — no spaces, no capitals.

4. Click **Save**

---

## Step 4 — Set the Homepage on the Portal

1. Go back to **Service Portal > Portals** and open **CMDB Health Doctor**
2. In the **Homepage** field, type `cmdb_health_home` and select it
3. Click **Save**

---

## Step 5 — Open Page Designer

Page Designer is where you place widgets onto the page visually.

1. Navigate to **Service Portal > Pages**
2. Open the **CMDB Health Home** page you just created
3. Click the **Open in Designer** button (or find it under **Related Links**)

   Alternatively, go directly to:
   ```
   https://epamsvsdemo3.service-now.com/sp_config?id=page_editor&sys_id=<page_sys_id>
   ```

---

## Step 6 — Add Row 1 (Header Widget)

In Page Designer:

1. You will see a blank canvas with a **+** button. Click it to add a new **Row**
2. Inside the row, click the **+** to add a **Column**. Choose **12 columns** (full width)
3. Inside the column, click the widget search box that appears
4. Type `CMDB Health Header` and select it from the dropdown

   > If it does not appear, search for `cmdb_health_header` (the widget ID)

5. The header widget will appear at the top of the page
6. **Enable fluid container for this row** — click anywhere on the Row (the grey bar), then in the right-side properties panel set **Container** to `false` (fluid/full-width). This removes SP's fixed max-width container so the widget spans the full browser window.

---

## Step 7 — Add Row 2 (Dashboard Widget)

1. Below Row 1, click the **+** button again to add a second **Row**
2. Add a **12-column** column inside it
3. Search for `CMDB Health Dashboard` and select it

   > Widget ID: `cmdb_health_dashboard`

4. The dashboard widget will appear below the header
5. **Enable fluid container for this row** — click on the Row bar, then in the right-side properties panel set **Container** to `false` (fluid/full-width), same as Row 1.

---

## Step 8 — Save the Page Layout

1. Click **Save** (top right of Page Designer)
2. You can also click the **eye icon** to preview the page inside the designer

---

## Step 9 — Open the Portal

Navigate to your portal in a browser:

```
https://epamsvsdemo3.service-now.com/cmdbhealthportal
```

Or with the explicit page ID:

```
https://epamsvsdemo3.service-now.com/cmdbhealthportal?id=cmdb_health_home
```

You should see:
- A dark metallic **header** with the app title, five count cards, and a Refresh button
- A **filter bar** below it (status pills, environment dropdown, sort, search, + ADD CI)
- A **grid of CI cards** for any records already in `x_epams_cmdb_healt_health_record`
  with `run_status = complete`

---

## Step 10 — Verify Widget Data

If the cards grid is empty, that is expected until the health evaluation job has run.
To trigger a test evaluation:

1. Go to **x_epams_cmdb_healt_health_record** in the navigator
2. Find a record with `run_status = complete` (or create one manually by setting a CI
   and run_status to `complete` with some score values filled in)
3. Refresh the portal — the card should appear

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| White space on left/right/bottom of page | In Page Designer, click each Row and set **Container** to `false` (fluid) in the right-side panel. This removes Bootstrap's fixed max-width. |
| Portal shows default ServiceNow theme | Check that the **Default Theme** on the portal record is set to `CMDB Health Dark` |
| Portal page is blank | Make sure the **Homepage** field on the portal record is `cmdb_health_home` |
| Widget not found in Page Designer search | The `npm run deploy` must have completed. Check the widget exists at **Service Portal > Widgets** and search for `cmdb_health_header` |
| Widget shows but no data | Confirm records exist in `x_epams_cmdb_healt_health_record` with `run_status = complete`. The dashboard only shows completed evaluations |
| Cards show but score bars are flat | The browser may have cached a stale page. Hard refresh (`Cmd+Shift+R` / `Ctrl+Shift+R`) |
| "Add CI" modal submits but nothing happens | The CI name must match exactly what is in the `name` field of `cmdb_ci`. Check capitalization |
| Expanded panel does not span full width | The grid needs to be full-width (12 col). If you placed the widget inside a narrower column, move it to a 12-col container |

---

## Quick Reference — Widget IDs

| Widget | ID (used in Page Designer search) |
|---|---|
| Header | `cmdb_health_header` |
| Dashboard | `cmdb_health_dashboard` |

## Quick Reference — Portal URLs

| Page | URL |
|---|---|
| Portal home | `https://epamsvsdemo3.service-now.com/cmdbhealthportal` |
| App record | `https://epamsvsdemo3.service-now.com/sys_app.do?sys_id=ab1ee2fcce944e6f81c9b14b5322c429` |
| Widgets list | `https://epamsvsdemo3.service-now.com/sp_widget_list.do` |
| Pages list | `https://epamsvsdemo3.service-now.com/sp_page_list.do` |
| Portals list | `https://epamsvsdemo3.service-now.com/sp_portal_list.do` |
