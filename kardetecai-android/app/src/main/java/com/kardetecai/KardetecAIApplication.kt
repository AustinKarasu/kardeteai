package com.kardetecai

import android.app.Application

class KardetecAIApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        instance = this
    }

    companion object {
        lateinit var instance: KardetecAIApplication
            private set
    }
}
