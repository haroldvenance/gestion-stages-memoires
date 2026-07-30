import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

function getTokens() {
  try {
    return JSON.parse(localStorage.getItem('tokens') || 'null')
  } catch {
    return null
  }
}

export function setTokens(tokens) {
  if (tokens) {
    localStorage.setItem('tokens', JSON.stringify(tokens))
  } else {
    localStorage.removeItem('tokens')
  }
}

api.interceptors.request.use((config) => {
  const tokens = getTokens()
  if (tokens?.access) {
    config.headers.Authorization = `Bearer ${tokens.access}`
  }
  return config
})

let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry && getTokens()?.refresh) {
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = axios
            .post('/api/auth/refresh/', { refresh: getTokens().refresh })
            .finally(() => {
              refreshPromise = null
            })
        }
        const { data } = await refreshPromise
        const tokens = getTokens()
        setTokens({ ...tokens, access: data.access })
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch {
        setTokens(null)
        window.location.href = '/connexion'
        return Promise.reject(error)
      }
    }
    return Promise.reject(error)
  }
)

export default api
