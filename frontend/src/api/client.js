import axios from 'axios'

// Récupère l'URL du backend depuis les variables d'environnement Vercel
// En local : http://127.0.0.1:8000
// En production : https://backend-api-0yjk.onrender.com
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
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
          // ⚠️ On utilise `api` au lieu d'`axios` pour bénéficier du bon baseURL
          refreshPromise = api
            .post('/auth/refresh/', { refresh: getTokens().refresh })
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