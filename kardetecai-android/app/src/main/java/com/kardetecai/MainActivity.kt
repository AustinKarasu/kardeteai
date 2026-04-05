package com.kardetecai

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import com.kardetecai.ui.screens.HomeScreen
import com.kardetecai.ui.theme.KardetecAITheme
import com.kardetecai.ui.viewmodel.DetectionViewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            KardetecAITheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val viewModel: DetectionViewModel = viewModel(
                        factory = DetectionViewModel.Factory(this)
                    )
                    HomeScreen(viewModel = viewModel)
                }
            }
        }
    }
}
