import { createContext, useContext, useMemo, useReducer, useEffect } from 'react'
import { initializeRealtimeConnection, handleRealtimeNotification } from '../services/sellerApi'

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
    commissionRate: '',
    cashbackRate: '',
    assignedVendor: '',
  },
  notifications: [],
  dashboard: {
    overview: null,
    wallet: null,
    referrals: null,
    performance: null,
    loading: false,
    error: null,
  },
  targetIncentives: [],
  realtimeConnected: false,
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
      return {
        ...state,
        authenticated: false,
        profile: initialState.profile,
        notifications: [],
        dashboard: initialState.dashboard,
        targetIncentives: [],
      }
    case 'UPDATE_PROFILE':
      return {
        ...state,
        profile: {
          ...state.profile,
          ...action.payload,
        },
      }
    case 'SET_DASHBOARD_LOADING':
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          loading: action.payload,
        },
      }
    case 'SET_DASHBOARD_ERROR':
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          error: action.payload,
          loading: false,
        },
      }
    case 'SET_DASHBOARD_OVERVIEW':
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          overview: action.payload,
          loading: false,
          error: null,
        },
      }
    case 'SET_WALLET_DATA':
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          wallet: action.payload,
          loading: false,
          error: null,
        },
      }
    case 'SET_REFERRALS_DATA':
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          referrals: action.payload,
          loading: false,
          error: null,
        },
      }
    case 'SET_PERFORMANCE_DATA':
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          performance: action.payload,
          loading: false,
          error: null,
        },
      }
    case 'SET_TARGET_INCENTIVES':
      return {
        ...state,
        targetIncentives: action.payload,
      }
    case 'ADD_NOTIFICATION':
      // Check if notification already exists (prevent duplicates)
      const existingIndex = state.notifications.findIndex(
        (n) => n.id === action.payload.id || (n.type === action.payload.type && n.orderId === action.payload.orderId),
      )
      if (existingIndex >= 0) {
        return state
      }
      return {
        ...state,
        notifications: [
          {
            id: action.payload.id || Date.now().toString(),
            ...action.payload,
            read: action.payload.read || false,
            timestamp: action.payload.timestamp || new Date().toISOString(),
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
    case 'SET_REALTIME_CONNECTED':
      return {
        ...state,
        realtimeConnected: action.payload,
      }
    case 'UPDATE_WALLET_BALANCE':
      const currentBalance = state.dashboard.wallet?.balance || 0
      const newBalance = action.payload.isIncrement
        ? currentBalance + action.payload.balance
        : action.payload.balance
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          wallet: {
            ...state.dashboard.wallet,
            balance: newBalance,
            pending: action.payload.pending !== undefined ? action.payload.pending : state.dashboard.wallet?.pending,
          },
        },
      }
    case 'UPDATE_TARGET_PROGRESS':
      return {
        ...state,
        dashboard: {
          ...state.dashboard,
          overview: {
            ...state.dashboard.overview,
            targetProgress: action.payload.progress,
            thisMonthSales: action.payload.thisMonthSales,
            status: action.payload.status,
          },
        },
      }
    default:
      return state
  }
}

export function SellerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  
  // Initialize real-time connection when authenticated
  useEffect(() => {
    if (state.authenticated && state.profile.sellerId) {
      const cleanup = initializeRealtimeConnection((notification) => {
        const processedNotification = handleRealtimeNotification(notification)
        
        // Handle different notification types
        switch (processedNotification.type) {
          case 'cashback_added':
            dispatch({
              type: 'ADD_NOTIFICATION',
              payload: {
                id: processedNotification.id,
                type: 'cashback',
                title: 'Cashback Added',
                message: `You earned ₹${processedNotification.amount} for User Order #${processedNotification.orderId}`,
                amount: processedNotification.amount,
                orderId: processedNotification.orderId,
                read: false,
              },
            })
            // Update wallet balance - will be handled by reducer using current state
            dispatch({
              type: 'UPDATE_WALLET_BALANCE',
              payload: {
                balance: processedNotification.amount, // Amount to add
                isIncrement: true, // Flag to indicate increment
              },
            })
            break
            
          case 'target_achieved':
            dispatch({
              type: 'ADD_NOTIFICATION',
              payload: {
                id: processedNotification.id,
                type: 'target',
                title: 'Target Achieved!',
                message: 'Congratulations! You reached your monthly goal.',
                read: false,
              },
            })
            break
            
          case 'announcement':
            dispatch({
              type: 'ADD_NOTIFICATION',
              payload: {
                id: processedNotification.id,
                type: 'announcement',
                title: processedNotification.title,
                message: processedNotification.message,
                read: false,
              },
            })
            break
            
          case 'withdrawal_approved':
            dispatch({
              type: 'ADD_NOTIFICATION',
              payload: {
                id: processedNotification.id,
                type: 'withdrawal',
                title: 'Withdrawal Approved',
                message: `Your withdrawal request of ₹${processedNotification.amount} has been approved`,
                amount: processedNotification.amount,
                read: false,
              },
            })
            break
            
          case 'withdrawal_rejected':
            dispatch({
              type: 'ADD_NOTIFICATION',
              payload: {
                id: processedNotification.id,
                type: 'withdrawal',
                title: 'Withdrawal Rejected',
                message: `Your withdrawal request was rejected. Reason: ${processedNotification.reason}`,
                read: false,
              },
            })
            break
            
          default:
            dispatch({
              type: 'ADD_NOTIFICATION',
              payload: {
                id: processedNotification.id,
                ...processedNotification,
                read: false,
              },
            })
        }
      })
      
      dispatch({ type: 'SET_REALTIME_CONNECTED', payload: true })
      
      return () => {
        cleanup()
        dispatch({ type: 'SET_REALTIME_CONNECTED', payload: false })
      }
    }
  }, [state.authenticated, state.profile.sellerId, dispatch])
  
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

