package com.example.biteswipe.pages

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle

import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
import com.example.biteswipe.helpers.ApiHelper
import com.example.biteswipe.BuildConfig
import com.example.biteswipe.R
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import com.google.android.libraries.identity.googleid.GoogleIdTokenParsingException

import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.cancel
import kotlinx.coroutines.launch
import org.json.JSONObject
import java.security.MessageDigest
import java.util.UUID


class LoginPage : AppCompatActivity(), ApiHelper {

    companion object {
        private const val TAG = "LoginPage"
        const val WEB_CLIENT_ID: String = BuildConfig.WEB_CLIENT_ID
    }



    private val coroutineScope = CoroutineScope(Dispatchers.Main)
    private lateinit var notificationType: String
    private lateinit var uniqueId: String
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login_page)
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
            != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this, arrayOf(Manifest.permission.POST_NOTIFICATIONS), 1)
        }

        notificationType = intent.getStringExtra("notificationType") ?: ""

        uniqueId = intent.getStringExtra("uniqueId") ?: ""


        val signInButton = findViewById<Button>(R.id.sign_in_button)

        signInButton.setOnClickListener {
            Log.d(TAG, "Sign in button clicked")
            Log.d(TAG, "WEB CLIENT ID: $WEB_CLIENT_ID")

            val credentialManager = CredentialManager.create(this)

            val signInWithGoogleOption: GetSignInWithGoogleOption = GetSignInWithGoogleOption
                .Builder(WEB_CLIENT_ID)
                .setNonce(generateHashedNonce())
            .build()

            val request: GetCredentialRequest = GetCredentialRequest.Builder()
                .addCredentialOption(signInWithGoogleOption)
                .build()

            coroutineScope.launch {
                try {
                    Log.d(TAG, "Requesting credential")
                    val result = credentialManager.getCredential(
                        request = request,
                        context = this@LoginPage,
                    )
                    Log.d(TAG, "Got credential: $result")
                    handleSignIn(result)
                } catch (e: GetCredentialException) {
                    handleFailure(e)
                }
            }
        }
    }

    private fun handleSignIn(result: GetCredentialResponse) {
        val credential = result.credential

        when (credential) {
            is CustomCredential -> {
                if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    try {
                        Log.d(TAG, "Received a valid Google ID token")
                        val googleIdTokenCredential = GoogleIdTokenCredential
                            .createFrom(credential.data)

                        // Log the ID Token for verification

                        var email = googleIdTokenCredential.id
                        val isNumber = email.matches(Regex("\\d+"))

                        // Check if the value matches an email format
                        val isEmail = email.matches(Regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"))

                        when {
                            isNumber -> email = email + "@gmail.com"
                            isEmail -> email = email
                            else -> Log.d(TAG, "Invalid email format")
                        }
                        val idToken = googleIdTokenCredential.idToken
                        Log.d(TAG, "Google Response: ${credential}")
                        Log.d(TAG, "ID Token: ${googleIdTokenCredential.idToken}")
                        Log.d(TAG, "User Email: $email")
                        val endpoint = "/users/"
                        val body = JSONObject().apply {
                            put("email", email)
                            put("displayName", googleIdTokenCredential.displayName)
                        }
                        apiRequest(
                            context = this,
                            endpoint = endpoint,
                            method = "POST",
                            jsonBody = body,
                            onSuccess = { response ->
                                Log.d(TAG, "Response: $response")
//                                TODO: Send profile pic url to backend as well
                                val intent = Intent(this, HomePage::class.java).apply {
                                    putExtra("displayName", googleIdTokenCredential.displayName)
                                    putExtra("userId", response.getString("_id"))
                                    putExtra("userEmail", email)
                                }
                                Log.d(TAG, "New User: ${googleIdTokenCredential.displayName}")
                                Toast.makeText(this, "Welcome, ${googleIdTokenCredential.displayName}", Toast.LENGTH_SHORT).show()
                                startActivity(intent)
                            },
                            onError = { code, message ->

                                val endpoint2 = "/users/emails/$email"
                                apiRequest(
                                    context = this,
                                    endpoint = endpoint2,
                                    method = "GET",
                                    onSuccess = { response ->
                                        Log.d(TAG, "Response: $response")
                                        val intent = Intent(this, HomePage::class.java).apply {
                                            putExtra(
                                                "displayName",
                                                response.getString("displayName")
                                            )
                                            putExtra("userId", response.getString("userId"))
                                            putExtra("userEmail", email)
                                            putExtra("notification_type", notificationType)
                                            putExtra("uniqueId", uniqueId)

                                        }
                                        Log.d(TAG, "Returning User: ${googleIdTokenCredential.displayName}")
                                        Toast.makeText(this, "Welcome Back, ${googleIdTokenCredential.displayName}", Toast.LENGTH_SHORT).show()
                                        startActivity(intent)
                                    },
                                    onError = { code, message ->
                                        Log.d(TAG, "Error: ${message}")
                                        Toast.makeText(this, "Error: Invalid User", Toast.LENGTH_SHORT).show()
                                    }
                                )

                            }
                        )

                    } catch (e: GoogleIdTokenParsingException) {
                        Log.e(TAG, "Received an invalid Google ID token response", e)
                    }
                } else {
                    Log.e(TAG, "Unexpected type of credential")
                }
            }
            else -> {
                Log.e(TAG, "Unexpected type of credential")
            }
        }
    }


    private fun handleFailure(e: GetCredentialException) {
        Log.e(TAG, "Failed to return credential", e)
        Toast.makeText(this, "Login Failure, Try Again", Toast.LENGTH_SHORT).show()
    }

    override fun onDestroy() {
        super.onDestroy()
        coroutineScope.cancel()
    }

    private fun generateHashedNonce(): String {
        val rawNonce = UUID.randomUUID().toString()
        val bytes = rawNonce.toByteArray()
        val md = MessageDigest.getInstance("SHA-256")
        val digest = md.digest(bytes)
        return digest.fold("") { str, it -> str + "%02x".format(it) }
    }
}
