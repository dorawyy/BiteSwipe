package com.example.biteswipe

import android.content.Context
import android.util.Log

import androidx.test.core.app.ApplicationProvider

import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.example.biteswipe.pages.LoginPage
import okhttp3.OkHttpClient
import okhttp3.Request
import org.junit.Assert.assertTrue
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class FNFRTests {

    private val context: Context = ApplicationProvider.getApplicationContext()
    private val baseUrl: String = context.getString(R.string.base_url)
    private val client = OkHttpClient()


    // --- Uptime Test ---
    @Test
    fun serverIsReachable() {
        val request = Request.Builder().url("$baseUrl/users/67c0106e9be4429eab3392b7").build()
        val response = client.newCall(request).execute()
        assertTrue("Server is not reachable!", response.isSuccessful)
    }

    // --- Performance Test ---
    @get:Rule
    val activityRule = ActivityScenarioRule(LoginPage::class.java)

    @Test
    fun loginScreenLoadsUnder5Seconds() {
        val startTime = System.currentTimeMillis()

        activityRule.scenario.onActivity {
            // Do nothing here for now — activity has started
        }

        val endTime = System.currentTimeMillis()
        val loadTime = endTime - startTime

        Log.d("LOGIN_TEST","Login screen loaded in $loadTime ms")
        assertTrue("Login screen took too long to load!", loadTime <= 5000)
    }
}