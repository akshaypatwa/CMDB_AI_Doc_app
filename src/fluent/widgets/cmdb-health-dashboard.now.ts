import { SPWidget } from '@servicenow/sdk/core'

export const cmdbHealthDashboardWidget = SPWidget({
    $id: Now.ID['cmdb_health_dashboard_widget'],
    name: 'CMDB Health Dashboard',
    id: 'cmdb_health_dashboard',
    description:
        'Main CMDB Health Doctor dashboard. Sticky filter bar (status pills, environment, sort, search, add CI), responsive 3-column grid of skeuomorphic CI cards with LED indicators and animated score bars, expandable detail panel with visual issue tiles, dimension scorecards with animated bars, AI terminal readout, priority action box, and styled recommendation cards. Includes Add CI modal and toast notifications.',
    category: 'custom',
    dataTable: 'sp_instance',
    htmlTemplate: Now.include('../../widgets/cmdb_health_dashboard/cmdb_health_dashboard.html'),
    customCss: Now.include('../../widgets/cmdb_health_dashboard/cmdb_health_dashboard.css'),
    clientScript: Now.include('../../widgets/cmdb_health_dashboard/cmdb_health_dashboard.client.js'),
    serverScript: Now.include('../../widgets/cmdb_health_dashboard/cmdb_health_dashboard.server.js'),
    hasPreview: false,
    public: false,
    servicenow: false,
})
