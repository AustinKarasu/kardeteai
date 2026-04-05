package com.kardetecai.ui.screens

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Info
import androidx.compose.material.icons.filled.PrivacyTip
import androidx.compose.material.icons.filled.Tune
import androidx.compose.material3.Button
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.kardetecai.BuildConfig
import com.kardetecai.data.local.ApiConfig
import com.kardetecai.ui.theme.Background
import com.kardetecai.ui.theme.Primary
import com.kardetecai.ui.theme.Secondary
import com.kardetecai.ui.theme.Surface
import com.kardetecai.ui.theme.TextPrimary
import com.kardetecai.ui.theme.TextSecondary
import com.kardetecai.ui.viewmodel.DetectionViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    viewModel: DetectionViewModel,
    onBack: () -> Unit
) {
    val analysisMode by viewModel.analysisMode
    val serviceMessage by viewModel.apiHealthMessage
    val healthLoading by viewModel.isHealthCheckLoading

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "Settings",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = TextSecondary
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Background,
                    titleContentColor = TextPrimary
                )
            )
        },
        containerColor = Background
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            SettingsCard(
                title = "Detection Mode",
                subtitle = "Choose how strict KardetecAI should be when classifying borderline results.",
                icon = {
                    Icon(
                        imageVector = Icons.Default.Tune,
                        contentDescription = null,
                        tint = Primary
                    )
                }
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    ModeButton(
                        title = "Conservative",
                        caption = "Recommended for fewer false positives",
                        selected = analysisMode == ApiConfig.MODE_CONSERVATIVE,
                        onClick = { viewModel.setAnalysisMode(ApiConfig.MODE_CONSERVATIVE) },
                        modifier = Modifier.weight(1f)
                    )
                    ModeButton(
                        title = "Balanced",
                        caption = "More decisive, but less cautious",
                        selected = analysisMode == ApiConfig.MODE_BALANCED,
                        onClick = { viewModel.setAnalysisMode(ApiConfig.MODE_BALANCED) },
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            SettingsCard(
                title = "Service Status",
                subtitle = "Quickly confirm that the live analysis service is reachable before you run a check.",
                icon = {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = Secondary
                    )
                }
            ) {
                Button(
                    onClick = viewModel::checkApiHealth,
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !healthLoading
                ) {
                    Text(if (healthLoading) "Checking Service..." else "Check Live Service")
                }

                Spacer(modifier = Modifier.height(10.dp))

                Text(
                    text = serviceMessage,
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }

            SettingsCard(
                title = "Interpret Results",
                subtitle = "Useful guidance for everyday users.",
                icon = {
                    Icon(
                        imageVector = Icons.Default.PrivacyTip,
                        contentDescription = null,
                        tint = Primary
                    )
                }
            ) {
                Text(
                    text = "Likely Human means the evidence leans toward real writing or photography.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Inconclusive means the app did not find enough reliable evidence either way.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Likely AI should be treated as a review signal, not a final verdict on its own.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }

            SettingsCard(
                title = "About",
                subtitle = "Product and release information.",
                icon = {
                    Icon(
                        imageVector = Icons.Default.Info,
                        contentDescription = null,
                        tint = Secondary
                    )
                }
            ) {
                Text(
                    text = "KardetecAI ${BuildConfig.VERSION_NAME}",
                    style = MaterialTheme.typography.bodyLarge,
                    color = TextPrimary,
                    fontWeight = FontWeight.SemiBold
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "Built to analyze AI-likelihood in text and images with a conservative scoring model designed to reduce false positives.",
                    style = MaterialTheme.typography.bodyMedium,
                    color = TextSecondary
                )
            }
        }
    }
}

@Composable
private fun SettingsCard(
    title: String,
    subtitle: String,
    icon: @Composable () -> Unit,
    content: @Composable () -> Unit
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = Surface),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                icon()
                Column {
                    Text(
                        text = title,
                        style = MaterialTheme.typography.titleMedium,
                        color = TextPrimary
                    )
                    Text(
                        text = subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = TextSecondary
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))
            content()
        }
    }
}

@Composable
private fun ModeButton(
    title: String,
    caption: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    val buttonContent: @Composable () -> Unit = {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            Text(text = title)
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = caption,
                style = MaterialTheme.typography.labelSmall
            )
        }
    }

    if (selected) {
        Button(
            onClick = onClick,
            modifier = modifier
        ) {
            buttonContent()
        }
    } else {
        OutlinedButton(
            onClick = onClick,
            modifier = modifier
        ) {
            buttonContent()
        }
    }
}
