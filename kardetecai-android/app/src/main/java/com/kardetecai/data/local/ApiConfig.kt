package com.kardetecai.data.local

import android.content.Context
import com.kardetecai.BuildConfig

object ApiConfig {
    private const val PREFS_NAME = "kardetecai_prefs"
    private const val KEY_BASE_URL = "api_base_url"

    fun getBaseUrl(context: Context): String {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        return sanitizeBaseUrl(prefs.getString(KEY_BASE_URL, null) ?: BuildConfig.DEFAULT_API_BASE_URL)
    }

    fun setBaseUrl(context: Context, url: String) {
        val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit().putString(KEY_BASE_URL, sanitizeBaseUrl(url)).apply()
    }

    fun resetBaseUrl(context: Context) {
        setBaseUrl(context, BuildConfig.DEFAULT_API_BASE_URL)
    }

    private fun sanitizeBaseUrl(url: String): String {
        val trimmed = url.trim()
        return if (trimmed.endsWith("/")) trimmed else "$trimmed/"
    }
}
