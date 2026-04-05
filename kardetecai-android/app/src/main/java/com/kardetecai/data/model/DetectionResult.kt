package com.kardetecai.data.model

import com.google.gson.annotations.SerializedName

sealed class DetectionResult {
    abstract val aiProbability: Int
    abstract val confidence: Int
    abstract val verdict: String
    abstract val summary: String
    abstract val highlights: List<String>
}

data class TextDetectionResult(
    @SerializedName("aiProbability")
    override val aiProbability: Int,

    @SerializedName("confidence")
    override val confidence: Int,

    @SerializedName("verdict")
    override val verdict: String,

    @SerializedName("summary")
    override val summary: String = "",

    @SerializedName("highlights")
    override val highlights: List<String> = emptyList(),

    @SerializedName("metrics")
    val metrics: TextMetrics? = null
) : DetectionResult()

data class ImageDetectionResult(
    @SerializedName("aiProbability")
    override val aiProbability: Int,

    @SerializedName("confidence")
    override val confidence: Int,

    @SerializedName("verdict")
    override val verdict: String,

    @SerializedName("summary")
    override val summary: String = "",

    @SerializedName("highlights")
    override val highlights: List<String> = emptyList(),

    @SerializedName("metrics")
    val metrics: ImageMetrics? = null,

    @SerializedName("imageInfo")
    val imageInfo: ImageInfo? = null
) : DetectionResult()

data class TextMetrics(
    @SerializedName("patternDensity")
    val patternDensity: Double,

    @SerializedName("sentenceVariation")
    val sentenceVariation: Double,

    @SerializedName("repetitionRisk")
    val repetitionRisk: Double,

    @SerializedName("vocabularyBalance")
    val vocabularyBalance: Double,

    @SerializedName("structureBalance")
    val structureBalance: Double,

    @SerializedName("humanSignal")
    val humanSignal: Double
)

data class ImageMetrics(
    @SerializedName("metadataRisk")
    val metadataRisk: Double,

    @SerializedName("generatorPatternRisk")
    val generatorPatternRisk: Double,

    @SerializedName("smoothnessRisk")
    val smoothnessRisk: Double,

    @SerializedName("artifactRisk")
    val artifactRisk: Double,

    @SerializedName("photoSignal")
    val photoSignal: Double,

    @SerializedName("detailBalance")
    val detailBalance: Double
)

data class ImageInfo(
    @SerializedName("width")
    val width: Int,

    @SerializedName("height")
    val height: Int,

    @SerializedName("format")
    val format: String
)

data class ApiResponse<T>(
    @SerializedName("success")
    val success: Boolean,

    @SerializedName("type")
    val type: String,

    @SerializedName("result")
    val result: T,

    @SerializedName("timestamp")
    val timestamp: String
)

data class TextDetectionRequest(
    @SerializedName("text")
    val text: String
)

data class HealthResponse(
    @SerializedName("status")
    val status: String,
    @SerializedName("timestamp")
    val timestamp: String? = null,
    @SerializedName("version")
    val version: String? = null
)

sealed class DetectionUiState {
    data object Idle : DetectionUiState()
    data object Loading : DetectionUiState()
    data class Success(val result: DetectionResult) : DetectionUiState()
    data class Error(val message: String) : DetectionUiState()
}
