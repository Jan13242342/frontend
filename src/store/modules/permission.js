import { asyncRoutes, constantRoutes } from '@/router'
import cloneDeep from 'lodash/cloneDeep'

function hasPermission(roles, route) {
  if (route.meta && route.meta.roles) {
    return roles.some(role => route.meta.roles.includes(role))
  } else {
    return true
  }
}

const state = {
  routes: [],
  addRoutes: []
}

const mutations = {
  SET_ROUTES: (state, routes) => {
    state.addRoutes = routes
    state.routes = constantRoutes.concat(routes)
  }
}

const actions = {
  async generateRoutes({ commit }, roles) {
    const routes = cloneDeep(asyncRoutes)
    const accessedRoutes = routes.filter(route => {
      if (hasPermission(roles, route)) {
        if (route.children) {
          route.children = route.children.filter(child => hasPermission(roles, child))
        }
        return true
      }
      return false
    })
    commit('SET_ROUTES', accessedRoutes)
    return accessedRoutes
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
