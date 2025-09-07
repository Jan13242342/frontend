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
