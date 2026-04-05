package com.kardetecai.data.repository

import android.content.Context
import android.net.Uri
import com.kardetecai.data.model.*
import com.kardetecai.data.remote.RetrofitClient
import com.kardetecai.utils.FileUtils
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import java.io.File

class DetectionRepository(private val context: Context) {

    private val apiService = RetrofitClient.detectionApiService

    suspend fun detectText(text: String): Result<TextDetectionResult> = withContext(Dispatchers.IO) {
        try {
            val request = TextDetectionRequest(text)
            val response = apiService.detectText(request)

            if (response.success) {
                Result.success(response.result)
            } else {
                Result.failure(Exception("Detection failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun detectImage(imageUri: Uri): Result<ImageDetectionResult> = withContext(Dispatchers.IO) {
        try {
            val file = FileUtils.getFileFromUri(context, imageUri)
                ?: return@withContext Result.failure(Exception("Could not read image file"))

            val requestFile = file.asRequestBody("image/*".toMediaTypeOrNull())
            val body = MultipartBody.Part.createFormData("image", file.name, requestFile)

            val response = apiService.detectImage(body)

            // Clean up temp file
            if (file.absolutePath.contains(context.cacheDir.absolutePath)) {
                file.delete()
            }

            if (response.success) {
                Result.success(response.result)
            } else {
                Result.failure(Exception("Detection failed"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
