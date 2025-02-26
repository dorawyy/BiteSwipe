package com.example.biteswipe

import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.biteswipe.ApiHelper
import org.json.JSONObject

class LoginPage : AppCompatActivity(), ApiHelper { // Implements APIHelper

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_login_page)

        val signInButton = findViewById<Button>(R.id.sign_in_button)

        signInButton.setOnClickListener {
            apiRequest(
                context = this,
                endpoint = "/todos/1",
                method = "GET",
                onSuccess = { response ->
                    val title = response.optString("title", "No Title Found")
                    Toast.makeText(this, title, Toast.LENGTH_SHORT).show()
                },
                onError = { code, message ->
                    Log.e("API_ERROR", "Error Code: $code, Message: $message")
                }
            )
        }
    }
}
