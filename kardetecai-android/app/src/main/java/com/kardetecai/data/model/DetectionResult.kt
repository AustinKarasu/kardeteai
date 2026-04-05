package com.kardetecai.data.model

import com.google.gson.annotations.SerializedName

sealed class DetectionResult {
    abstract val aiProbability: Int
    abstract val confidence: Int
    abstract val verdict: String
}

data class TextDetectionResult(
    @SerializedName("aiProbability")
    override val aiProbability: Int,

    @SerializedName("confidence")
    override val confidence: Int,

    @SerializedName("verdict")
    override val verdict: String,

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

    @SerializedName("metrics")
    val metrics: ImageMetrics? = null,

    @SerializedName("imageInfo")
    val imageInfo: ImageInfo? = null
) : DetectionResult()

data class TextMetrics(
    @SerializedName("perplexity")
    val perplexity: Double,

    @SerializedName("burstiness")
    val burstiness: Double,

    @SerializedName("aiPatternScore")
    val aiPatternScore: Double,

    @SerializedName("semanticCoherence")
    val semanticCoherence: Double,

    @SerializedName("repetitionScore")
    val repetitionScore: Double,

    @SerializedName("vocabularyDiversity")
    val vocabularyDiversity: Double,

    @SerializedName("sentenceStructure")
    val sentenceStructure: Double
)

data class ImageMetrics(
    @SerializedName("noisePattern")
    val noisePattern: Double,

    @SerializedName("colorDistribution")
    val colorDistribution: Double,

    @SerializedName("edgeConsistency")
    val edgeConsistency: Double,

    @SerializedName("metadataAnalysis")
    val metadataAnalysis: Double,

    @SerializedName("compressionArtifacts")
    val compressionArtifacts: Double,

    @SerializedName("textureAnalysis")
    val textureAnalysis: Double,

    @SerializedName("frequencyAnalysis")
    val frequencyAnalysis: Double
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

sealed class DetectionUiState {
    data object Idle : DetectionUiState()
    data object Loading : DetectionUiState()
    data class Success(val result: DetectionResult) : DetectionUiState()
    data class Error(val message: String) : DetectionUiState()
}
