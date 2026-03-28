import { ApplicationMenu, Record } from '@servicenow/sdk/core'

export const cmdbHealthAppMenu = ApplicationMenu({
    $id: Now.ID['cmdb_health_app_menu'],
    title: 'CMDB Health Doctor',
    hint: 'AI-powered CMDB health analysis and recommendations',
    order: 100,
    category: '',
    roles: ['snc_internal'],
})

Record({
    $id: Now.ID['all_health_records_module'],
    table: 'sys_app_module',
    data: {
        title: 'All Health Records',
        name: 'x_epams_cmdb_healt_health_record',
        application: cmdbHealthAppMenu,
        link_type: 'LIST',
        active: true,
        order: 100,
        override_menu_roles: false,
        require_confirmation: false,
        sys_domain: 'global',
        sys_domain_path: '/',
        uncancelable: false,
    },
})

Record({
    $id: Now.ID['critical_ci_module'],
    table: 'sys_app_module',
    data: {
        title: 'Critical CIs',
        name: 'x_epams_cmdb_healt_health_record',
        application: cmdbHealthAppMenu,
        link_type: 'LIST',
        active: true,
        order: 200,
        override_menu_roles: false,
        require_confirmation: false,
        sys_domain: 'global',
        sys_domain_path: '/',
        uncancelable: false,
    },
})

Record({
    $id: Now.ID['pending_review_module'],
    table: 'sys_app_module',
    data: {
        title: 'Pending Review',
        name: 'x_epams_cmdb_healt_health_record',
        application: cmdbHealthAppMenu,
        link_type: 'LIST',
        active: true,
        order: 300,
        override_menu_roles: false,
        require_confirmation: false,
        sys_domain: 'global',
        sys_domain_path: '/',
        uncancelable: false,
    },
})
