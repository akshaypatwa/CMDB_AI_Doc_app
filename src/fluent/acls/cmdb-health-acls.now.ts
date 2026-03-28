import { Acl } from '@servicenow/sdk/core'

Acl({
  $id: Now.ID['health_record_read_acl'],
  type: 'record',
  table: 'x_epams_cmdb_healt_health_record',
  operation: 'read',
  roles: ['itil', 'admin', 'cmdb_read'],
  active: true
})

Acl({
  $id: Now.ID['health_record_write_acl'],
  type: 'record',
  table: 'x_epams_cmdb_healt_health_record',
  operation: 'write',
  roles: ['admin'],
  active: true
})

Acl({
  $id: Now.ID['health_record_create_acl'],
  type: 'record',
  table: 'x_epams_cmdb_healt_health_record',
  operation: 'create',
  roles: ['admin'],
  active: true
})
