# Portal Setup Reference

How to create and configure the CMDB Health Doctor Service Portal page in ServiceNow.

---

## 1. Portal Record

Navigate to **Service Portal > Portals** and create (or confirm) the portal record:

| Field | Value |
|---|---|
| Title | CMDB Health Doctor |
| URL Suffix | `cmdbhealthportal` |
| Default Theme | (select or create — see Theme section below) |
| Homepage | `cmdb_health_home` (the page you'll create next) |
| Knowledge Base | (leave blank) |
| Login page | `login` |

---

## 2. Portal Theme (CSS Variables)

Navigate to **Service Portal > Themes** and create a theme (or clone Default):

| Field | Value |
|---|---|
| Name | CMDB Health Dark |
| CSS Variables | (paste block below) |

```scss
@navbar-default-bg:        #0d0d1a;
@navbar-default-color:     #e8eaf6;
@navbar-default-link-color:#9fa8da;
@body-bg:                  #0d0d1a;
@text-color:               #e8eaf6;
@link-color:               #4fc3f7;
@btn-default-bg:           #16213e;
@btn-default-color:        #e8eaf6;
@btn-default-border:       rgba(255,255,255,0.1);
@panel-bg:                 #1a1a2e;
@panel-border-color:       rgba(255,255,255,0.06);
@input-bg:                 #0d1525;
@input-color:              #e8eaf6;
@input-border:             rgba(255,255,255,0.12);
@dropdown-bg:              #16213e;
@dropdown-link-color:      #9fa8da;
@dropdown-link-hover-bg:   #0f3460;
```

Additionally, add the following CSS to the theme's **CSS** field to inject the skeuomorphism base styles globally (or place in the widget CSS directly):

```css
/* Global dark base */
body, .sp-page-root { background: #0d0d1a !important; }

/* Ensure grid columns have no bootstrap padding interference */
.cmdb-dashboard .col-xs-12 { padding-left: 0; padding-right: 0; }
```

---

## 3. Portal Page

Navigate to **Service Portal > Pages** and create:

| Field | Value |
|---|---|
| Title | CMDB Health Home |
| ID | `cmdb_health_home` |

Open the **Page Designer** for this page and configure the layout:

```
Row 1  — Full Width (12 col)
  └── Widget: cmdb_health_header

Row 2  — Full Width (12 col)
  └── Widget: cmdb_health_dashboard
```

**How to add a widget in Page Designer:**
1. Click the `+` icon on a container.
2. Search for the widget by name.
3. Click the gear icon on the widget instance → confirm `Instance` tab — `Table` field should be `sp_instance` (this is set automatically; do not change).

---

## 4. Widget Records

Create each widget via **Service Portal > Widgets** (or via the now-sdk widget files):

### Widget 1 — Header

| Field | Value |
|---|---|
| Name | CMDB Health Header |
| ID | `cmdb_health_header` |
| Data Table | `sp_instance` |

Tabs to fill: **HTML Template**, **CSS**, **Client Script**, **Server Script**

### Widget 2 — Dashboard

| Field | Value |
|---|---|
| Name | CMDB Health Dashboard |
| ID | `cmdb_health_dashboard` |
| Data Table | `sp_instance` |

Tabs to fill: **HTML Template**, **CSS**, **Client Script**, **Server Script**

---

## 5. Access the Portal

After setup, the portal is available at:

```
https://<instance>.service-now.com/cmdbhealthportal
```

Or via the shortened page URL:

```
https://<instance>.service-now.com/cmdbhealthportal?id=cmdb_health_home
```

---

## 6. now-sdk Widget File Structure

When building widgets via the CLI / now-sdk, each widget lives in:

```
src/
  cmdb_health_header/
    cmdb_health_header.html          ← HTML Template
    cmdb_health_header.scss          ← CSS (SCSS)
    cmdb_health_header.client.js     ← Client Script
    cmdb_health_header.server.js     ← Server Script
    cmdb_health_header.json          ← Widget manifest

  cmdb_health_dashboard/
    cmdb_health_dashboard.html
    cmdb_health_dashboard.scss
    cmdb_health_dashboard.client.js
    cmdb_health_dashboard.server.js
    cmdb_health_dashboard.json
```

Widget manifest (`*.json`) minimum structure:

```json
{
  "name": "CMDB Health Dashboard",
  "id": "cmdb_health_dashboard",
  "description": "Skeuomorphic CI health card grid with expandable detail panel",
  "data_table": "sp_instance",
  "template": "cmdb_health_dashboard.html",
  "css": "cmdb_health_dashboard.scss",
  "client_script": "cmdb_health_dashboard.client.js",
  "server_script": "cmdb_health_dashboard.server.js"
}
```

---

## 7. Common Gotchas

| Issue | Fix |
|---|---|
| Portal shows blank page | Check the homepage ID matches the page `ID` field exactly |
| Widget CSS not applying | Paste CSS into the widget's **CSS** tab, not the theme — theme CSS is global and can conflict |
| `$scope.data` is undefined on load | Server script must set `data.fieldName` before widget loads — never access unset keys |
| Page designer won't save widget | Widget `data_table` must be `sp_instance` — never a custom table |
| Expanded panel overlaps cards | The detail panel must be inside the `ng-repeat` and use `grid-column: 1 / -1` to span full grid width |
| Dark theme not applying | Set the portal's **Default Theme** field to the custom theme record you created |
