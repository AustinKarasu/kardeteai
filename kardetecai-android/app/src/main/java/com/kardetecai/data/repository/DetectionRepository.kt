package com.kardetecai.data.repository

import android.content.Context
import android.net.Uri
import com.google.gson.Gson
import com.google.gson.JsonObject
import com.kardetecai.data.local.ApiConfig
import com.kardetecai.data.model.*
import com.kardetecai.data.remote.RetrofitClient
import com.kardetecai.utils.FileUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import retrofit2.HttpException

class DetectionRepository(private val context: Context) {
    private fun apiService() = RetrofitClient.createDetectionApiService(ApiConfig.getBaseUrl(context))
    private fun analysisMode() = ApiConfig.getAnalysisMode(context)

    suspend fun detectText(text: String): Result<TextDetectionResult> = withContext(Dispatchers.IO) {
        try {
            val request = TextDetectionRequest(text)
            val response = apiService().detectText(analysisMode(), request)

            if (response.success) {
                Result.success(response.result)
            } else {
                Result.failure(Exception("Detection failed on server"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(extractErrorMessage(e)))
        }
    }

    suspend fun detectImage(imageUri: Uri): Result<ImageDetectionResult> = withContext(Dispatchers.IO) {
        try {
            val file = FileUtils.getFileFromUri(context, imageUri)
                ?: return@withContext Result.failure(Exception("Could not read image file"))

            val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("image", file.name, requestFile)

            val response = apiService().detectImage(analysisMode(), body)

            // Clean up temp file
            if (file.absolutePath.contains(context.cacheDir.absolutePath)) {
                file.delete()
            }

            if (response.success) {
                Result.success(response.result)
            } else {
                Result.failure(Exception("Detection failed on server"))
            }
        } catch (e: Exception) {
            Result.failure(Exception(extractErrorMessage(e)))
        }
    }

    suspend fun healthCheck(): Result<HealthResponse> = withContext(Dispatchers.IO) {
        try {
            val response = apiService().healthCheck()
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(Exception(extractErrorMessage(e)))
        }
    }

    fun getBaseUrl(): String = ApiConfig.getBaseUrl(context)

    fun setBaseUrl(url: String) {
        ApiConfig.setBaseUrl(context, url)
    }

    fun resetBaseUrl() {
        ApiConfig.resetBaseUrl(context)
    }

    fun getAnalysisMode(): String = ApiConfig.getAnalysisMode(context)

    fun setAnalysisMode(mode: String) {
        ApiConfig.setAnalysisMode(context, mode)
    }

    private fun extractErrorMessage(error: Exception): String {
        if (error is HttpException) {
            val body = error.response()?.errorBody()?.string()
            if (!body.isNullOrBlank()) {
                return try {
                    val obj = Gson().fromJson(body, JsonObject::class.java)
                    obj.get("message")?.asString
                        ?: obj.get("error")?.asString
                        ?: "HTTP ${error.code()} error"
                } catch (_: Exception) {
                    "HTTP ${error.code()} error"
                }
            }
            return "HTTP ${error.code()} error"
        }
        return error.message ?: "Unexpected network error"
    }
}
