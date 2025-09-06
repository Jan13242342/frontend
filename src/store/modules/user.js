import { login, logout, getInfo } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'

const state = {
  token: getToken(),
  name: '',
  avatar: '',
  roles: []
}

const mutations = {
  SET_TOKEN: (state, token) => { state.token = token },
  SET_NAME: (state, name) => { state.name = name },
  SET_AVATAR: (state, avatar) => { state.avatar = avatar },
  SET_ROLES: (state, roles) => { state.roles = roles }
}

const actions = {
  login({ commit }, userInfo) {
    return login(userInfo).then(response => {
      console.log('login response:', response)
      const { token } = response.data
      commit('SET_TOKEN', token)
      setToken(token)
    })
  },

  async getInfo({ commit, state }) {
    const response = await getInfo(state.token)
    const data = response.data
    const roles = data.roles || (data.role ? [data.role] : ['user'])
    commit('SET_ROLES', roles)
    commit('SET_NAME', data.username)
    commit('SET_AVATAR', data.avatar || '')
    return { ...data, roles }
  },

  logout({ commit, state }) {
    return logout(state.token).then(() => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      commit('SET_AVATAR', '')
      removeToken()
    })
  },

  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      removeToken()
      resolve()
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}

