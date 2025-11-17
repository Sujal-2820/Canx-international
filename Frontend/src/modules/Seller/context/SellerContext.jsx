import { createContext, useContext, useMemo, useReducer } from 'react'

const initialState = {
  language: 'en',
  role: null,
  authenticated: false,
  profile: {
    name: 'Guest Seller',
    sellerId: '',
    area: '',
    phone: '',
    email: '',
  },
  notifications: [],
}

// Use a symbol to detect if context is actually provided
const SELLER_CONTEXT_SYMBOL = Symbol('SellerContextProvided')

const SellerStateContext = createContext(null)
const SellerDispatchContext = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload }
    case 'SET_ROLE':
      return { ...state, role: action.payload }
    case 'AUTH_LOGIN':
      return {
        ...state,
        authenticated: true,
        profile: {
          ...state.profile,
          ...action.payload,
        },
      }
    case 'AUTH_LOGOUT':
      return { ...state, authenticated: false, profile: initialState.profile, notifications: [] }
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          {
            id: Date.now().toString(),
            ...action.payload,
            read: false,
            timestamp: new Date().toISOString(),
          },
          ...state.notifications,
        ],
      }
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map((notif) =>
          notif.id === action.payload.id ? { ...notif, read: true } : notif,
        ),
      }
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map((notif) => ({ ...notif, read: true })),
      }
    default:
      return state
  }
}

export function SellerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const value = useMemo(() => ({ ...state, [SELLER_CONTEXT_SYMBOL]: true }), [state])
  const dispatchWithSymbol = useMemo(() => {
    const wrappedDispatch = (action) => dispatch(action)
    wrappedDispatch[SELLER_CONTEXT_SYMBOL] = true
    return wrappedDispatch
  }, [dispatch])
  return (
    <SellerStateContext.Provider value={value}>
      <SellerDispatchContext.Provider value={dispatchWithSymbol}>{children}</SellerDispatchContext.Provider>
    </SellerStateContext.Provider>
  )
}

export function useSellerState() {
  const context = useContext(SellerStateContext)
  if (!context || !context[SELLER_CONTEXT_SYMBOL]) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('useSellerState must be used within SellerProvider')
      throw new Error('useSellerState must be used within SellerProvider')
    }
    // In production, return initial state to prevent crashes
    return initialState
  }
  // Remove the symbol before returning
  const { [SELLER_CONTEXT_SYMBOL]: _, ...state } = context
  return state
}

export function useSellerDispatch() {
  const dispatch = useContext(SellerDispatchContext)
  if (!dispatch || !dispatch[SELLER_CONTEXT_SYMBOL]) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('useSellerDispatch must be used within SellerProvider')
      throw new Error('useSellerDispatch must be used within SellerProvider')
    }
    // In production, return a no-op function to prevent crashes
    return () => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('SellerDispatch called outside SellerProvider')
      }
    }
  }
  // Return the dispatch function directly
  return dispatch
}

