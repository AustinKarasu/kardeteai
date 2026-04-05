package com.kardetecai.ui.components

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.kardetecai.data.model.DetectionResult
import com.kardetecai.data.model.ImageDetectionResult
import com.kardetecai.data.model.TextDetectionResult
import com.kardetecai.ui.theme.*

@Composable
fun ResultCard(
    result: DetectionResult,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    val verdictColor = when {
        result.aiProbability >= 70 -> AIGeneratedColor
        result.aiProbability >= 40 -> PossiblyAIColor
        else -> HumanWrittenColor
    }

    val verdictIcon = when {
        result.aiProbability >= 70 -> Icons.Default.Warning
        result.aiProbability >= 40 -> Icons.Default.Help
        else -> Icons.Default.CheckCircle
    }

    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Header with gradient background
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(16.dp))
                    .background(
                        brush = Brush.linearGradient(
                            colors = listOf(
                                verdictColor.copy(alpha = 0.3f),
                                verdictColor.copy(alpha = 0.1f)
                            )
                        )
                    )
                    .padding(20.dp),
                contentAlignment = Alignment.Center
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = verdictIcon,
                        contentDescription = null,
                        tint = verdictColor,
                        modifier = Modifier.size(32.dp)
                    )
                    Spacer(modifier = Modifier.width(12.dp))
                    Text(
                        text = result.verdict,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = verdictColor
                    )
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Animated Circle Progress
            AnimatedCircleProgress(
                percentage = result.aiProbability,
                size = 180
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Confidence indicator
            ConfidenceIndicator(confidence = result.confidence)

            Spacer(modifier = Modifier.height(24.dp))

            // Metrics Section
            when (result) {
                is TextDetectionResult -> {
                    TextMetricsSection(metrics = result.metrics)
                }
                is ImageDetectionResult -> {
                    ImageMetricsSection(metrics = result.metrics)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Done Button
            Button(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = "Done",
                    modifier = Modifier.padding(vertical = 8.dp),
                    style = MaterialTheme.typography.labelLarge
                )
            }
        }
    }
}

@Composable
private fun TextMetricsSection(metrics: com.kardetecai.data.model.TextMetrics?) {
    if (metrics == null) return

    Column {
        Text(
            text = "Analysis Details",
            style = MaterialTheme.typography.titleMedium,
            color = TextPrimary,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        MetricBar("Perplexity Score", metrics.perplexity / 200.0, Info)
        MetricBar("Burstiness", metrics.burstiness / 5.0, Primary)
        MetricBar("AI Patterns", metrics.aiPatternScore, Warning)
        MetricBar("Semantic Coherence", metrics.semanticCoherence, Success)
    }
}

@Composable
private fun ImageMetricsSection(metrics: com.kardetecai.data.model.ImageMetrics?) {
    if (metrics == null) return

    Column {
        Text(
            text = "Analysis Details",
            style = MaterialTheme.typography.titleMedium,
            color = TextPrimary,
            modifier = Modifier.padding(bottom = 12.dp)
        )

        MetricBar("Noise Pattern", metrics.noisePattern, Info)
        MetricBar("Color Distribution", metrics.colorDistribution, Primary)
        MetricBar("Edge Consistency", metrics.edgeConsistency, Success)
        MetricBar("Texture Analysis", metrics.textureAnalysis, Secondary)
    }
}

@Composable
private fun MetricBar(
    label: String,
    value: Double,
    color: Color
) {
    val clampedValue = value.coerceIn(0.0, 1.0)

    Column(modifier = Modifier.padding(vertical = 6.dp)) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
            Text(
                text = "${(clampedValue * 100).toInt()}%",
                style = MaterialTheme.typography.bodySmall,
                color = color,
                fontWeight = FontWeight.SemiBold
            )
        }

        Spacer(modifier = Modifier.height(4.dp))

        LinearProgressIndicator(
            progress = { clampedValue.toFloat() },
            modifier = Modifier
                .fillMaxWidth()
                .height(6.dp)
                .clip(RoundedCornerShape(3.dp)),
            color = color,
            trackColor = SurfaceVariant
        )
    }
}
