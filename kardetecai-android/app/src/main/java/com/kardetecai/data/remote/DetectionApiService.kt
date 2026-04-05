package com.kardetecai.data.remote

import com.kardetecai.data.model.ApiResponse
import com.kardetecai.data.model.ImageDetectionResult
import com.kardetecai.data.model.TextDetectionRequest
import com.kardetecai.data.model.TextDetectionResult
import okhttp3.MultipartBody
import retrofit2.http.Body
import retrofit2.http.Multipart
import retrofit2.http.POST
import retrofit2.http.Part

interface DetectionApiService {

    @POST("api/detect/text")
    suspend fun detectText(
        @Body request: TextDetectionRequest
    ): ApiResponse<TextDetectionResult>

    @Multipart
    @POST("api/detect/image")
    suspend fun detectImage(
        @Part image: MultipartBody.Part
    ): ApiResponse<ImageDetectionResult>
}
