package com.kardetecai.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.kardetecai.ui.theme.*

@Composable
fun AnimatedCircleProgress(
    percentage: Int,
    accentColor: Color,
    modifier: Modifier = Modifier,
    size: Int = 200,
    strokeWidth: Float = 20f,
    animationDuration: Int = 1500
) {
    var currentPercentage by remember { mutableIntStateOf(0) }

    val animatedProgress by animateFloatAsState(
        targetValue = currentPercentage / 100f,
        animationSpec = tween(
            durationMillis = animationDuration,
            easing = FastOutSlowInEasing
        ),
        label = "progress"
    )

    LaunchedEffect(percentage) {
        currentPercentage = percentage
    }

    Box(
        modifier = modifier.size(size.dp),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            // Background circle
            drawArc(
                color = SurfaceVariant,
                startAngle = -90f,
                sweepAngle = 360f,
                useCenter = false,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )

            // Progress circle with gradient
            drawArc(
                brush = Brush.sweepGradient(
                    colors = listOf(accentColor, accentColor.copy(alpha = 0.7f), accentColor)
                ),
                startAngle = -90f,
                sweepAngle = animatedProgress * 360f,
                useCenter = false,
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "$percentage%",
                fontSize = (size / 5).sp,
                fontWeight = FontWeight.Bold,
                color = TextPrimary
            )
            Text(
                text = "AI Likelihood",
                fontSize = (size / 15).sp,
                color = TextSecondary
            )
        }
    }
}

@Composable
fun ConfidenceIndicator(
    confidence: Int,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "Confidence: ",
            style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
            color = TextSecondary
        )
        Text(
            text = "$confidence%",
            style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold,
            color = when {
                confidence >= 80 -> Success
                confidence >= 60 -> Warning
                else -> Error
            }
        )
    }
}
