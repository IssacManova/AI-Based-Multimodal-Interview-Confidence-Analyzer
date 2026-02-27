import axios from 'axios'

const api = axios.create({
    baseURL: '/api',
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
})

// Separate instance with longer timeout for the interview endpoint
// (backend records for 30s + processing, so we need 90s minimum)
const apiLong = axios.create({
    baseURL: '/api',
    timeout: 90000,
    headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to both instances
const attachToken = (config) => {
    const authData = JSON.parse(localStorage.getItem('interview-analyzer-auth') || '{}')
    const token = authData?.state?.token
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
}

api.interceptors.request.use(attachToken, (error) => Promise.reject(error))
apiLong.interceptors.request.use(attachToken, (error) => Promise.reject(error))

// Response interceptor – handle 401
const handle401 = (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('interview-analyzer-auth')
        window.location.href = '/login'
    }
    return Promise.reject(error)
}
api.interceptors.response.use((r) => r, handle401)
apiLong.interceptors.response.use((r) => r, handle401)

// ─── Auth API ───────────────────────────────────────
export const authAPI = {
    register: (data) => api.post('/register', data),
    login: (data) => api.post('/login', data),
    me: () => api.get('/me'),
}

// ─── Interview API ───────────────────────────────────
export const interviewAPI = {
    // Use long timeout — backend records for 30s before it can respond
    start: () => apiLong.post('/start-interview'),
    analyzeFrame: (frame) => api.post('/analyze-frame', { frame }),
    saveSession: (data) => api.post('/save-session', data),
    getSessions: () => api.get('/sessions'),
    getStats: () => api.get('/stats'),
}

export default api
