import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,

            login: (user, token) => {
                set({ user, token, isAuthenticated: true })
            },

            logout: () => {
                set({ user: null, token: null, isAuthenticated: false })
            },

            updateUser: (userData) => {
                set((state) => ({ user: { ...state.user, ...userData } }))
            },

            getToken: () => get().token,
        }),
        {
            name: 'interview-analyzer-auth',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
)

export default useAuthStore
