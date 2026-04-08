import { SPWidget } from '@servicenow/sdk/core'

export const cmdbHealthHeaderWidget = SPWidget({
    $id: Now.ID['cmdb_health_header_widget'],
    name: 'CMDB Health Header',
    id: 'cmdb_health_header',
    description:
        'Skeuomorphic dark control-panel header for the CMDB Health Doctor portal. Shows the app title with a pulsing critical-alert dot, five count cards (Total / Critical / Moderate / Minor / Healthy), the last analysis timestamp, and a refresh button.',
    category: 'custom',
    dataTable: 'sp_instance',
    htmlTemplate: Now.include('../../widgets/cmdb_health_header/cmdb_health_header.html'),
    customCss: Now.include('../../widgets/cmdb_health_header/cmdb_health_header.css'),
    clientScript: Now.include('../../widgets/cmdb_health_header/cmdb_health_header.client.js'),
    serverScript: Now.include('../../widgets/cmdb_health_header/cmdb_health_header.server.js'),
    hasPreview: false,
    public: false,
    servicenow: false,
})
