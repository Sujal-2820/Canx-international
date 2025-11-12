import { createContext, useContext, useMemo, useReducer } from 'react'

const VendorStateContext = createContext(null)
const VendorDispatchContext = createContext(() => {})

const initialState = {
  language: 'en',
  role: null,
  authenticated: false,
  profile: {
    name: 'Guest Vendor',
  },
}

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
      return { ...state, authenticated: false, profile: initialState.profile }
    default:
      return state
  }
}

export function VendorProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const value = useMemo(() => state, [state])
  return (
    <VendorStateContext.Provider value={value}>
      <VendorDispatchContext.Provider value={dispatch}>{children}</VendorDispatchContext.Provider>
    </VendorStateContext.Provider>
  )
}

export function useVendorState() {
  const context = useContext(VendorStateContext)
  if (!context) throw new Error('useVendorState must be used within VendorProvider')
  return context
}

export function useVendorDispatch() {
  const dispatch = useContext(VendorDispatchContext)
  if (!dispatch) throw new Error('useVendorDispatch must be used within VendorProvider')
  return dispatch
}

