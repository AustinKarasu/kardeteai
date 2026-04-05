package com.kardetecai.ui.viewmodel

import android.content.Context
import android.net.Uri
import androidx.compose.runtime.State
import androidx.compose.runtime.mutableStateOf
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.kardetecai.data.model.*
import com.kardetecai.data.repository.DetectionRepository
import kotlinx.coroutines.launch

class DetectionViewModel(context: Context) : ViewModel() {

    private val repository = DetectionRepository(context.applicationContext)

    private val _textUiState = mutableStateOf<DetectionUiState>(DetectionUiState.Idle)
    val textUiState: State<DetectionUiState> = _textUiState

    private val _imageUiState = mutableStateOf<DetectionUiState>(DetectionUiState.Idle)
    val imageUiState: State<DetectionUiState> = _imageUiState

    private val _selectedImageUri = mutableStateOf<Uri?>(null)
    val selectedImageUri: State<Uri?> = _selectedImageUri

    private val _inputText = mutableStateOf("")
    val inputText: State<String> = _inputText

    private val _apiBaseUrl = mutableStateOf(repository.getBaseUrl())
    val apiBaseUrl: State<String> = _apiBaseUrl

    private val _apiHealthMessage = mutableStateOf("Not tested yet")
    val apiHealthMessage: State<String> = _apiHealthMessage

    private val _isHealthCheckLoading = mutableStateOf(false)
    val isHealthCheckLoading: State<Boolean> = _isHealthCheckLoading

    fun updateInputText(text: String) {
        _inputText.value = text
    }

    fun setSelectedImage(uri: Uri?) {
        _selectedImageUri.value = uri
    }

    fun detectText() {
        val text = _inputText.value.trim()

        if (text.length < 50) {
            _textUiState.value = DetectionUiState.Error("Text must be at least 50 characters")
            return
        }

        viewModelScope.launch {
            _textUiState.value = DetectionUiState.Loading

            repository.detectText(text)
                .onSuccess { result ->
                    _textUiState.value = DetectionUiState.Success(result)
                }
                .onFailure { error ->
                    _textUiState.value = DetectionUiState.Error(
                        error.message ?: "An error occurred"
                    )
                }
        }
    }

    fun detectImage() {
        val uri = _selectedImageUri.value

        if (uri == null) {
            _imageUiState.value = DetectionUiState.Error("Please select an image first")
            return
        }

        viewModelScope.launch {
            _imageUiState.value = DetectionUiState.Loading

            repository.detectImage(uri)
                .onSuccess { result ->
                    _imageUiState.value = DetectionUiState.Success(result)
                }
                .onFailure { error ->
                    _imageUiState.value = DetectionUiState.Error(
                        error.message ?: "An error occurred"
                    )
                }
        }
    }

    fun clearTextResult() {
        _textUiState.value = DetectionUiState.Idle
        _inputText.value = ""
    }

    fun clearImageResult() {
        _imageUiState.value = DetectionUiState.Idle
        _selectedImageUri.value = null
    }

    fun clearTextError() {
        if (_textUiState.value is DetectionUiState.Error) {
            _textUiState.value = DetectionUiState.Idle
        }
    }

    fun clearImageError() {
        if (_imageUiState.value is DetectionUiState.Error) {
            _imageUiState.value = DetectionUiState.Idle
        }
    }

    fun updateApiBaseUrl(url: String) {
        _apiBaseUrl.value = url
    }

    fun saveApiBaseUrl() {
        repository.setBaseUrl(_apiBaseUrl.value)
        _apiBaseUrl.value = repository.getBaseUrl()
        _apiHealthMessage.value = "API URL saved"
    }

    fun resetApiBaseUrl() {
        repository.resetBaseUrl()
        _apiBaseUrl.value = repository.getBaseUrl()
        _apiHealthMessage.value = "API URL reset to default"
    }

    fun checkApiHealth() {
        viewModelScope.launch {
            _isHealthCheckLoading.value = true
            repository.healthCheck()
                .onSuccess { health ->
                    _apiHealthMessage.value =
                        "Connected: ${health.status} (v${health.version ?: "n/a"})"
                }
                .onFailure { error ->
                    _apiHealthMessage.value = "Connection failed: ${error.message ?: "Unknown error"}"
                }
            _isHealthCheckLoading.value = false
        }
    }

    class Factory(private val context: Context) : ViewModelProvider.Factory {
        @Suppress("UNCHECKED_CAST")
        override fun <T : ViewModel> create(modelClass: Class<T>): T {
            if (modelClass.isAssignableFrom(DetectionViewModel::class.java)) {
                return DetectionViewModel(context) as T
            }
            throw IllegalArgumentException("Unknown ViewModel class")
        }
    }
}
