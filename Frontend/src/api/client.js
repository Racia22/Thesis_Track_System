import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
})

function getStoredAuth() {
  const raw = localStorage.getItem('thesistrack.auth')
  return raw ? JSON.parse(raw) : null
}

function setStoredAuth(auth) {
  if (auth) {
    localStorage.setItem('thesistrack.auth', JSON.stringify(auth))
  } else {
    localStorage.removeItem('thesistrack.auth')
  }
}

apiClient.interceptors.request.use((config) => {
  const auth = getStoredAuth()
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`
  }
  return config
})

let refreshPromise = null

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const isAuthEndpoint = config?.url?.startsWith('/auth/')

    if (response?.status === 401 && !config._retry && !isAuthEndpoint) {
      config._retry = true
      const auth = getStoredAuth()

      if (!auth?.refreshToken) {
        setStoredAuth(null)
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE_URL}/auth/refresh`, { refreshToken: auth.refreshToken })
            .finally(() => {
              refreshPromise = null
            })
        }
        const { data } = await refreshPromise
        setStoredAuth(data)
        config.headers.Authorization = `Bearer ${data.accessToken}`
        return apiClient(config)
      } catch (refreshError) {
        setStoredAuth(null)
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

export { getStoredAuth, setStoredAuth }
export default apiClient
