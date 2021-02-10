const db = require('./CRUD')


const tenantId = "4fcf5e97-0487-4a20-afc7-3c51cecb0974"
db.deleteTenant({'tenantId': tenantId})