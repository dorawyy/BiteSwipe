package com.example.biteswipe

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.credentials.CredentialManager
import androidx.credentials.CustomCredential
import androidx.credentials.GetCredentialRequest
import androidx.credentials.GetCredentialResponse
import androidx.credentials.exceptions.GetCredentialException
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
        const val WEB_CLIENT_ID: String =
            "11247540626-e0ltc1jrde1jq5ilfks9m5aopo1csg81.apps.googleusercontent.com"
    }



    private val coroutineScope = CoroutineScope(Dispatchers.Main)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login_page)
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
//                        val email = googleIdTokenCredential.id
                        val email = "youThoughtThisWasReal@stupidasshacker.com"
                        Log.d(TAG, "ID Token: ${googleIdTokenCredential.idToken}")
                        Log.d(TAG, "User Email: ${email}")
                        val endpoint = "/users/"
                        val body = JSONObject().apply {
                            put("email", email)
//                            put("displayName", googleIdTokenCredential.displayName)
                            put("displayName", "Test User")
                        }
                        apiRequest(
                            context = this,
                            endpoint = endpoint,
                            method = "POST",
                            jsonBody = body,
                            onSuccess = { response ->
                                Log.d(TAG, "Response: $response")
                                val intent = Intent(this, HomePage::class.java).apply {
                                    putExtra("displayName", googleIdTokenCredential.displayName)
                                    putExtra("userId", response.getString("_id"))
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
