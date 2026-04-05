package com.kardetecai.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Clear
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.kardetecai.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TextInputSection(
    value: String,
    onValueChange: (String) -> Unit,
    onClear: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .heightIn(min = 200.dp, max = 300.dp)
                .clip(RoundedCornerShape(16.dp))
                .background(Surface)
        ) {
            TextField(
                value = value,
                onValueChange = onValueChange,
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState()),
                placeholder = {
                    Text(
                        text = "Paste your text here (minimum 50 characters)...",
                        color = TextTertiary
                    )
                },
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Surface,
                    unfocusedContainerColor = Surface,
                    disabledContainerColor = Surface,
                    focusedTextColor = TextPrimary,
                    unfocusedTextColor = TextPrimary,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                    cursorColor = Primary
                ),
                keyboardOptions = KeyboardOptions(
                    keyboardType = KeyboardType.Text,
                    imeAction = ImeAction.Default
                ),
                shape = RoundedCornerShape(16.dp)
            )

            // Character count and clear button
            if (value.isNotEmpty()) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                        .align(androidx.compose.ui.Alignment.BottomEnd),
                    horizontalArrangement = Arrangement.End
                ) {
                    Text(
                        text = "${value.length} chars",
                        style = MaterialTheme.typography.labelSmall,
                        color = if (value.length < 50) Error else TextSecondary
                    )

                    Spacer(modifier = Modifier.width(8.dp))

                    IconButton(
                        onClick = onClear,
                        modifier = Modifier.size(24.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Clear,
                            contentDescription = "Clear",
                            tint = TextSecondary,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }

        if (value.isNotEmpty() && value.length < 50) {
            Text(
                text = "Text must be at least 50 characters for accurate detection",
                style = MaterialTheme.typography.labelSmall,
                color = Error,
                modifier = Modifier.padding(top = 8.dp, start = 4.dp)
            )
        }
    }
}


