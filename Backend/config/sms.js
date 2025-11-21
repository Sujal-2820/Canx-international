const axios = require('axios');

/**
 * SMS Service Configuration - SMS India Hub
 * 
 * This module handles OTP and SMS notifications via SMS India Hub API
 */

const SMS_INDIA_HUB_API_URL = process.env.SMS_INDIA_HUB_API_URL || 'https://api.smsindiahub.in/api/v3';
const SMS_INDIA_HUB_API_KEY = process.env.SMS_INDIA_HUB_API_KEY;
const SMS_INDIA_HUB_SENDER_ID = process.env.SMS_INDIA_HUB_SENDER_ID || 'IRASAT';

/**
 * Generate 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP via SMS India Hub
 * @param {string} phoneNumber - Recipient phone number (with country code, e.g., +91xxxxxxxxxx)
 * @param {string} otp - 6-digit OTP code
 * @returns {Promise<Object>} - API response
 */
const sendOTP = async (phoneNumber, otp) => {
  try {
    if (!SMS_INDIA_HUB_API_KEY) {
      throw new Error('SMS_INDIA_HUB_API_KEY is not configured');
    }

    // Format phone number (ensure it starts with +91 for India)
    const formattedPhone = phoneNumber.startsWith('+91') 
      ? phoneNumber 
      : phoneNumber.startsWith('91')
      ? `+${phoneNumber}`
      : `+91${phoneNumber}`;

    // OTP message template
    const message = `Your IRA SATHI OTP is ${otp}. Valid for 5 minutes. Do not share this OTP with anyone.`;

    // SMS India Hub API request
    const response = await axios.post(
      `${SMS_INDIA_HUB_API_URL}/send`,
      {
        api_key: SMS_INDIA_HUB_API_KEY,
        to: formattedPhone,
        from: SMS_INDIA_HUB_SENDER_ID,
        message: message,
        route: 'otp', // OTP route for better deliverability
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      messageId: response.data?.message_id || null,
      message: 'OTP sent successfully',
    };
  } catch (error) {
    console.error('SMS sending error:', error.response?.data || error.message);
    
    // In development, allow OTP to work even if SMS fails
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ SMS sending failed, but allowing OTP in development mode');
      return {
        success: true,
        message: 'OTP generated (SMS failed in dev mode)',
        otp: otp, // Return OTP for testing in dev
      };
    }
    
    throw new Error('Failed to send OTP. Please try again.');
  }
};

/**
 * Send general SMS notification
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} message - SMS message content
 * @returns {Promise<Object>} - API response
 */
const sendSMS = async (phoneNumber, message) => {
  try {
    if (!SMS_INDIA_HUB_API_KEY) {
      throw new Error('SMS_INDIA_HUB_API_KEY is not configured');
    }

    const formattedPhone = phoneNumber.startsWith('+91') 
      ? phoneNumber 
      : phoneNumber.startsWith('91')
      ? `+${phoneNumber}`
      : `+91${phoneNumber}`;

    const response = await axios.post(
      `${SMS_INDIA_HUB_API_URL}/send`,
      {
        api_key: SMS_INDIA_HUB_API_KEY,
        to: formattedPhone,
        from: SMS_INDIA_HUB_SENDER_ID,
        message: message,
        route: 'transactional',
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      messageId: response.data?.message_id || null,
      message: 'SMS sent successfully',
    };
  } catch (error) {
    console.error('SMS sending error:', error.response?.data || error.message);
    throw new Error('Failed to send SMS');
  }
};

module.exports = {
  generateOTP,
  sendOTP,
  sendSMS,
};

