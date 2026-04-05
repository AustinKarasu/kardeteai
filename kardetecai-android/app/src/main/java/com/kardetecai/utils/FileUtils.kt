package com.kardetecai.utils

import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.provider.OpenableColumns
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream

object FileUtils {

    suspend fun getFileFromUri(context: Context, uri: Uri): File? = withContext(Dispatchers.IO) {
        try {
            val contentResolver = context.contentResolver
            val cursor = contentResolver.query(uri, null, null, null, null)

            val fileName = cursor?.use {
                val nameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
                it.moveToFirst()
                it.getString(nameIndex) ?: "temp_image.jpg"
            } ?: "temp_image.jpg"

            val file = File(context.cacheDir, fileName)

            contentResolver.openInputStream(uri)?.use { inputStream ->
                FileOutputStream(file).use { outputStream ->
                    inputStream.copyTo(outputStream)
                }
            }

            file
        } catch (e: Exception) {
            e.printStackTrace()
            null
        }
    }

    suspend fun saveBitmapToFile(context: Context, bitmap: Bitmap, fileName: String): File =
        withContext(Dispatchers.IO) {
            val file = File(context.cacheDir, fileName)
            FileOutputStream(file).use { out ->
                bitmap.compress(Bitmap.CompressFormat.JPEG, 90, out)
            }
            file
        }
}
