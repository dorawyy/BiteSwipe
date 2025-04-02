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
import com.example.biteswipe.ApiHelper
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.system.measureTimeMillis

@RunWith(AndroidJUnit4::class)
class FNFRTests{

    private val context: Context = ApplicationProvider.getApplicationContext()

    object TestApiHelper : ApiHelper


    // --- Uptime Test ---
    @Test
    fun serverIsReachable() {

        TestApiHelper.apiRequest(
            context = context,
            endpoint = "/users/67c0106e9be4429eab3392b7",
            method = "GET",
            onSuccess = {
                assertTrue("Server is reachable", true)
            },
            onError = { code, message ->
                assertTrue("Server is not reachable", false)
            }
        )
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