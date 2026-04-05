package com.kardetecai.ui.screens

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Analytics
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.kardetecai.data.model.DetectionUiState
import com.kardetecai.ui.components.*
import com.kardetecai.ui.theme.*
import com.kardetecai.ui.viewmodel.DetectionViewModel

@Composable
fun TextDetectionScreen(
    viewModel: DetectionViewModel,
    modifier: Modifier = Modifier
) {
    val textUiState by viewModel.textUiState
    val inputText by viewModel.inputText

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        // Header
        Text(
            text = "AI Text Detection",
            style = MaterialTheme.typography.headlineMedium,
            color = TextPrimary,
            fontWeight = FontWeight.Bold,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Paste text below to check if it was written by AI",
            style = MaterialTheme.typography.bodyLarge,
            color = TextSecondary,
            textAlign = TextAlign.Center,
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Content based on state
        AnimatedContent(
            targetState = textUiState,
            label = "text_detection_content",
            transitionSpec = {
                fadeIn(animationSpec = tween(300)) togetherWith
                fadeOut(animationSpec = tween(300))
            }
        ) { state ->
            when (state) {
                is DetectionUiState.Idle -> {
                    TextInputSection(
                        value = inputText,
                        onValueChange = viewModel::updateInputText,
                        onClear = { viewModel.updateInputText("") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                is DetectionUiState.Loading -> {
                    Box(
                        modifier = Modifier.fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        LoadingAnimation(
                            message = "Analyzing text...",
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
                is DetectionUiState.Success -> {
                    ResultCard(
                        result = state.result,
                        onDismiss = viewModel::clearTextResult,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
                is DetectionUiState.Error -> {
                    Column {
                        TextInputSection(
                            value = inputText,
                            onValueChange = viewModel::updateInputText,
                            onClear = { viewModel.updateInputText("") },
                            modifier = Modifier.fillMaxWidth()
                        )

                        Spacer(modifier = Modifier.height(16.dp))

                        Card(
                            colors = CardDefaults.cardColors(containerColor = Error.copy(alpha = 0.1f)),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier.padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = state.message,
                                    color = Error,
                                    modifier = Modifier.weight(1f)
                                )
                                TextButton(onClick = viewModel::clearTextError) {
                                    Text("Dismiss", color = Error)
                                }
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Analyze Button (only show when not loading and not showing result)
        if (textUiState !is DetectionUiState.Loading &&
            textUiState !is DetectionUiState.Success
        ) {
            Button(
                onClick = viewModel::detectText,
                modifier = Modifier.fillMaxWidth(),
                enabled = inputText.length >= 50,
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                shape = MaterialTheme.shapes.large
            ) {
                Icon(
                    imageVector = Icons.Default.Analytics,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Analyze Text",
                    modifier = Modifier.padding(vertical = 12.dp),
                    style = MaterialTheme.typography.labelLarge
                )
            }
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Info card
        InfoCard()
    }
}

@Composable
private fun InfoCard() {
    Card(
        colors = CardDefaults.cardColors(containerColor = SurfaceVariant.copy(alpha = 0.5f)),
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "How it works",
                style = MaterialTheme.typography.titleSmall,
                color = TextPrimary,
                fontWeight = FontWeight.SemiBold
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "Our algorithm analyzes writing patterns, perplexity, burstiness, and semantic coherence to detect AI-generated text with high accuracy.",
                style = MaterialTheme.typography.bodySmall,
                color = TextSecondary
            )
        }
    }
}
