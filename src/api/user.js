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

