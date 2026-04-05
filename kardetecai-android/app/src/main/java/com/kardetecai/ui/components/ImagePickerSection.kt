package com.kardetecai.ui.components

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.kardetecai.ui.theme.*

@Composable
fun ImagePickerSection(
    selectedImageUri: Uri?,
    onImageSelected: (Uri) -> Unit,
    onClearImage: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    var showImageSourceDialog by remember { mutableStateOf(false) }

    val galleryLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { onImageSelected(it) }
    }

    Column(modifier = modifier) {
        // Image display area
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .aspectRatio(4f / 3f)
                .clip(RoundedCornerShape(20.dp))
                .background(Surface)
                .border(
                    width = 2.dp,
                    color = if (selectedImageUri == null) SurfaceVariant else Primary,
                    shape = RoundedCornerShape(20.dp)
                )
                .clickable(enabled = selectedImageUri == null) {
                    showImageSourceDialog = true
                },
            contentAlignment = Alignment.Center
        ) {
            if (selectedImageUri != null) {
                // Show selected image
                Box(modifier = Modifier.fillMaxSize()) {
                    AsyncImage(
                        model = selectedImageUri,
                        contentDescription = "Selected image",
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )

                    // Clear button overlay
                    IconButton(
                        onClick = onClearImage,
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(8.dp)
                            .background(
                                color = Background.copy(alpha = 0.8f),
                                shape = RoundedCornerShape(50)
                            )
                    ) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Remove image",
                            tint = TextPrimary
                        )
                    }
                }
            } else {
                // Empty state
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Icon(
                        imageVector = Icons.Default.AddPhotoAlternate,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = Primary
                    )

                    Spacer(modifier = Modifier.height(16.dp))

                    Text(
                        text = "Tap to select an image",
                        style = MaterialTheme.typography.bodyLarge,
                        color = TextSecondary
                    )

                    Spacer(modifier = Modifier.height(8.dp))

                    Text(
                        text = "Supported: JPG, PNG, WebP",
                        style = MaterialTheme.typography.bodySmall,
                        color = TextTertiary
                    )
                }
            }
        }
    }

    // Image source selection dialog
    if (showImageSourceDialog) {
        AlertDialog(
            onDismissRequest = { showImageSourceDialog = false },
            title = {
                Text(
                    text = "Select Image",
                    style = MaterialTheme.typography.headlineSmall
                )
            },
            text = {
                Column {
                    ListItem(
                        headlineContent = {
                            Text(
                                text = "Gallery",
                                fontWeight = FontWeight.Medium
                            )
                        },
                        supportingContent = {
                            Text(text = "Choose from your photos")
                        },
                        leadingContent = {
                            Icon(
                                imageVector = Icons.Default.PhotoLibrary,
                                contentDescription = null,
                                tint = Primary
                            )
                        },
                        modifier = Modifier.clickable {
                            showImageSourceDialog = false
                            galleryLauncher.launch("image/*")
                        }
                    )
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showImageSourceDialog = false }) {
                    Text("Cancel")
                }
            },
            containerColor = Surface
        )
    }
}
