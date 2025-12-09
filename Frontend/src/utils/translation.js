/**
 * Translation Utility
 * Handles translation using Google Translate API directly from frontend
 */

const GOOGLE_TRANSLATE_API_KEY = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || 'AIzaSyC2UW5-Nt9KidxOfBRrZImeBRh9SOMGluo'
const GOOGLE_TRANSLATE_API_URL = 'https://translation.googleapis.com/language/translate/v2'
const TRANSLATION_CACHE_KEY = 'ira_sathi_translation_cache'
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 days

// Load cache from localStorage
function getCache() {
  try {
    const cached = localStorage.getItem(TRANSLATION_CACHE_KEY)
    if (cached) {
      return JSON.parse(cached)
    }
  } catch (error) {
    console.error('[Translation] Error loading cache:', error)
  }
  return {}
}

// Save cache to localStorage
function saveCache(cache) {
  try {
    localStorage.setItem(TRANSLATION_CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('[Translation] Error saving cache:', error)
  }
}

// Get cache key for text and target language
function getCacheKey(text, targetLang) {
  return `${targetLang}:${text}`
}

// Check if cache entry is valid
function isCacheValid(entry) {
  if (!entry || !entry.timestamp) return false
  return Date.now() - entry.timestamp < CACHE_EXPIRY
}

// Translate text using Google Translate API
async function translateTextWithAPI(text, targetLang) {
  try {
    const sourceLang = 'en'
    const targetLangCode = targetLang === 'hi' ? 'hi' : targetLang
    
    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        source: sourceLang,
        target: targetLangCode,
        format: 'text',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Google Translate API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    
    if (data.data && data.data.translations && data.data.translations.length > 0) {
      return data.data.translations[0].translatedText
    }
    
    throw new Error('No translation returned from API')
  } catch (error) {
    console.error('[Translation] Google Translate API error:', error)
    throw error
  }
}

/**
 * Get translation for a single text
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code (e.g., 'hi')
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Promise<string>} Translated text
 */
export async function getTranslation(text, targetLang = 'hi', forceRefresh = false) {
  if (!text || typeof text !== 'string') {
    return text
  }

  if (targetLang === 'en') {
    return text
  }

  const trimmedText = text.trim()
  if (!trimmedText) {
    return text
  }

  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cache = getCache()
    const cacheKey = getCacheKey(trimmedText, targetLang)
    const cached = cache[cacheKey]
    
    if (isCacheValid(cached)) {
      return cached.translated
    }
  }

  try {
    // Call translation API
    const translated = await translateTextWithAPI(trimmedText, targetLang)
    
    // Save to cache
    const cache = getCache()
    const cacheKey = getCacheKey(trimmedText, targetLang)
    cache[cacheKey] = {
      translated,
      timestamp: Date.now(),
    }
    saveCache(cache)
    
    return translated
  } catch (error) {
    console.error('[Translation] Error translating:', error)
    // Return original text on error
    return text
  }
}

/**
 * Get translations for multiple texts (batch)
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLang - Target language code (e.g., 'hi')
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Promise<string[]>} Array of translated texts
 */
export async function getBatchTranslations(texts, targetLang = 'hi', forceRefresh = false) {
  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    return texts || []
  }

  if (targetLang === 'en') {
    return texts
  }

  const results = []
  const textsToTranslate = []
  const indices = []

  // Check cache for each text
  const cache = getCache()
  
  texts.forEach((text, index) => {
    if (!text || typeof text !== 'string') {
      results[index] = text
      return
    }

    const trimmedText = text.trim()
    if (!trimmedText) {
      results[index] = text
      return
    }

    if (!forceRefresh) {
      const cacheKey = getCacheKey(trimmedText, targetLang)
      const cached = cache[cacheKey]
      
      if (isCacheValid(cached)) {
        results[index] = cached.translated
        return
      }
    }

    // Need to translate this one
    textsToTranslate.push(trimmedText)
    indices.push(index)
  })

  // If all texts were cached, return results
  if (textsToTranslate.length === 0) {
    return results
  }

  try {
    // Call Google Translate API for batch translation
    const sourceLang = 'en'
    const targetLangCode = targetLang === 'hi' ? 'hi' : targetLang
    
    const response = await fetch(`${GOOGLE_TRANSLATE_API_URL}?key=${GOOGLE_TRANSLATE_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: textsToTranslate,
        source: sourceLang,
        target: targetLangCode,
        format: 'text',
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`Google Translate API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
    }

    const data = await response.json()
    
    if (data.data && data.data.translations && Array.isArray(data.data.translations)) {
      // Update cache and results
      textsToTranslate.forEach((text, i) => {
        const translated = data.data.translations[i]?.translatedText || text
        const originalIndex = indices[i]
        results[originalIndex] = translated
        
        // Save to cache
        const cacheKey = getCacheKey(text, targetLang)
        cache[cacheKey] = {
          translated,
          timestamp: Date.now(),
        }
      })
      
      saveCache(cache)
      return results
    }
    
    throw new Error('No translations returned from API')
  } catch (error) {
    console.error('[Translation] Batch translation error:', error)
    // Fallback: translate individually
    const fallbackResults = [...results]
    for (let i = 0; i < textsToTranslate.length; i++) {
      const originalIndex = indices[i]
      try {
        fallbackResults[originalIndex] = await getTranslation(textsToTranslate[i], targetLang, forceRefresh)
      } catch {
        fallbackResults[originalIndex] = textsToTranslate[i]
      }
    }
    return fallbackResults
  }
}

/**
 * Clear translation cache
 */
export function clearTranslationCache() {
  try {
    localStorage.removeItem(TRANSLATION_CACHE_KEY)
  } catch (error) {
    console.error('[Translation] Error clearing cache:', error)
  }
}

