import request from '@/utils/request'

export function login(data) {
  return request({
    url: '/v1/login', // 不要写 /api///
    method: 'post',
    data
  })
}

export function logout(token) {
  return request({
    url: '/v1/logout',
    method: 'post',
    headers: { Authorization: 'Bearer ' + token }
  })
}

export function getInfo(token) {
  return request({
    url: '/v1/getinfo',
    method: 'get',
    headers: { Authorization: 'Bearer ' + token }
  })
}

export function sendRegisterEmailCode(email) {
  return request({
    url: 'v1/send_email_code_register',
    method: 'post',
    data: { email }
  })
}

export function register(data) {
  return request({
    url: 'v1/register',
    method: 'post',
    data
  })
}

export function getDevicePara(token, params) {
  return request({
    url: 'v1/device/para',
    method: 'get',
    params,
    headers: { Authorization: 'Bearer ' + token }
  })
}

export function rpcChangePara(token, data) {
  return request({
    url: 'v1/device/rpc_change',
    method: 'post',
    data,
    headers: { Authorization: 'Bearer ' + token }
  })
}

export function getRpcHistory(token, params) {
  return request({
    url: 'v1/device/rpc_history',
    method: 'get',
    params,
    headers: { Authorization: 'Bearer ' + token }
  })
}
export function online_summary(token) {
  return request({
    url: 'v1/devices/online_summary',
    method: 'get',
    headers: { Authorization: 'Bearer ' + token }
  })
}
export function alarm_summary(token) {
  return request({
    url: 'v1/alarms/unhandled_count',
    method: 'get',
    headers: { Authorization: 'Bearer ' + token }
  })
}

export function getRealtimeBySn(device_sn, token) {
  return request({
    url: `v1/realtime/by_sn/${device_sn}`,
    method: 'get',
    headers: { Authorization: 'Bearer ' + token }
  })
}

export function getHistoryBySn({ device_sn, period = 'today', page = 1, page_size = 100 }, token) {
  return request({
    url: `v1/history/admin/by_sn`,
    method: 'get',
    headers: { Authorization: 'Bearer ' + token },
    params: {
      device_sn,
      period,
      page,
      page_size
    }
  })
}

export function uploadOta(token, file, device_type, version, status, min_hardware_version) {
  const params = new URLSearchParams({
    device_type,
    version,
    status,
    min_hardware_version
  }).toString()
  const formData = new FormData()
  formData.append('file', file)
  return request({
    url: `/v1/firmware/upload?${params}`,
    method: 'post',
    data: formData,
    headers: {
      Authorization: 'Bearer ' + token,
      'Content-Type': 'multipart/form-data'
    }
  })
}

export function getLatestFirmware(device_type, token, hardware_version = '') {
  const params = { device_type }
  if (hardware_version) params.hardware_version = hardware_version
  return request({
    url: '/v1/firmware/latest',
    method: 'get',
    params,
    headers: { Authorization: 'Bearer ' + token }
  })
}

export function getFirmwareList(device_type, token, status = '') {
  const params = { device_type }
  if (status) params.status = status
  return request({
    url: '/v1/firmware/list',
    method: 'get',
    params,
    headers: { Authorization: 'Bearer ' + token }
  })
}

export function deleteFirmware(firmware_id, token) {
  return request({
    url: `/v1/firmware/${firmware_id}`,
    method: 'delete',
    headers: { Authorization: 'Bearer ' + token }
  })
}

export function getLatestStagingFirmware(device_type, hardware_version, status, token) {
  return request({
    url: '/v1/firmware/latest-staging',
    method: 'get',
    params: {
      device_type,
      hardware_version,
      status
    },
    headers: { Authorization: 'Bearer ' + token }
  })
}

// New: list firmware audit logs
export function getFirmwareAuditLog(params, token) {
  return request({
    url: '/v1/firmware/audit-log',
    method: 'get',
    params,
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  })
}
