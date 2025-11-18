/**
 * Custom hook for Seller API integration
 * Provides easy access to API functions with loading states and error handling
 */

import { useState, useCallback } from 'react'
import { useSellerDispatch } from '../context/SellerContext'
import * as sellerApi from '../services/sellerApi'

export function useSellerApi() {
  const dispatch = useSellerDispatch()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleApiCall = useCallback(
    async (apiFunction, successAction, errorMessage) => {
      setLoading(true)
      setError(null)
      try {
        const data = await apiFunction()
        if (successAction) {
          dispatch(successAction(data))
        }
        return { data, error: null }
      } catch (err) {
        const errorMsg = errorMessage || err.message || 'An error occurred'
        setError(errorMsg)
        return { data: null, error: err }
      } finally {
        setLoading(false)
      }
    },
    [dispatch],
  )

  // Dashboard APIs
  const fetchDashboardOverview = useCallback(async () => {
    return handleApiCall(
      sellerApi.getDashboardOverview,
      (data) => ({ type: 'SET_DASHBOARD_OVERVIEW', payload: data }),
      'Failed to load dashboard overview',
    )
  }, [handleApiCall])

  const fetchWalletData = useCallback(async () => {
    return handleApiCall(
      sellerApi.getWalletBalance,
      (data) => ({ type: 'SET_WALLET_DATA', payload: data }),
      'Failed to load wallet data',
    )
  }, [handleApiCall])

  const fetchReferrals = useCallback(async (params = {}) => {
    return handleApiCall(
      () => sellerApi.getReferrals(params),
      (data) => ({ type: 'SET_REFERRALS_DATA', payload: data }),
      'Failed to load referrals',
    )
  }, [handleApiCall])

  const fetchPerformance = useCallback(async (params = {}) => {
    return handleApiCall(
      () => sellerApi.getPerformanceAnalytics(params),
      (data) => ({ type: 'SET_PERFORMANCE_DATA', payload: data }),
      'Failed to load performance data',
    )
  }, [handleApiCall])

  const fetchTargetIncentives = useCallback(async () => {
    return handleApiCall(
      sellerApi.getTargetIncentives,
      (data) => ({ type: 'SET_TARGET_INCENTIVES', payload: data.incentives || [] }),
      'Failed to load target incentives',
    )
  }, [handleApiCall])

  // Profile APIs
  const updateProfile = useCallback(
    async (profileData) => {
      return handleApiCall(
        () => sellerApi.updateSellerProfile(profileData),
        (data) => ({ type: 'UPDATE_PROFILE', payload: data }),
        'Failed to update profile',
      )
    },
    [handleApiCall],
  )

  const changePassword = useCallback(
    async (passwordData) => {
      return handleApiCall(
        () => sellerApi.changePassword(passwordData),
        null,
        'Failed to change password',
      )
    },
    [handleApiCall],
  )

  // Wallet APIs
  const requestWithdrawal = useCallback(
    async (withdrawalData) => {
      return handleApiCall(
        () => sellerApi.requestWithdrawal(withdrawalData),
        null,
        'Failed to submit withdrawal request',
      )
    },
    [handleApiCall],
  )

  // Notification APIs
  const markNotificationRead = useCallback(
    async (notificationId) => {
      try {
        await sellerApi.markNotificationRead(notificationId)
        dispatch({ type: 'MARK_NOTIFICATION_READ', payload: { id: notificationId } })
        return { data: null, error: null }
      } catch (err) {
        setError(err.message)
        return { data: null, error: err }
      }
    },
    [dispatch],
  )

  const markAllNotificationsRead = useCallback(async () => {
    return handleApiCall(
      sellerApi.markAllNotificationsRead,
      () => ({ type: 'MARK_ALL_NOTIFICATIONS_READ' }),
      'Failed to mark notifications as read',
    )
  }, [handleApiCall])

  // Support APIs
  const reportIssue = useCallback(
    async (reportData) => {
      return handleApiCall(
        () => sellerApi.reportIssue(reportData),
        null,
        'Failed to submit report',
      )
    },
    [handleApiCall],
  )

  return {
    loading,
    error,
    fetchDashboardOverview,
    fetchWalletData,
    fetchReferrals,
    fetchPerformance,
    fetchTargetIncentives,
    updateProfile,
    changePassword,
    requestWithdrawal,
    markNotificationRead,
    markAllNotificationsRead,
    reportIssue,
  }
}

