package com.example.biteswipe.pages

import android.os.Bundle
import android.widget.Button
import android.widget.ImageButton
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.biteswipe.R
import com.example.biteswipe.helpers.ApiHelper
import com.example.biteswipe.helpers.ToastHelper
import org.json.JSONObject

class SettingsPage : AppCompatActivity(), ApiHelper, ToastHelper {
    private lateinit var userId: String
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_settings)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        userId = intent.getStringExtra("userId") ?: ""
        val changeNameButton = findViewById<Button>(R.id.submit_display_name_button)
        changeNameButton.setOnClickListener {
            val newName = findViewById<com.google.android.material.textfield.TextInputEditText>(R.id.display_name_input).text.toString()
            if(newName.isEmpty()){
                showCustomToast(this, "Please enter a new name", false)
                return@setOnClickListener
            }
            val body = JSONObject().apply {
                put("displayName", newName)
            }
            val endpoint = "/users/$userId/updateDisplayName"
            apiRequest(
                context = this,
                endpoint = endpoint,
                method = "POST",
                jsonBody = body,
                onSuccess = { _ ->
                    showCustomToast(this, "Display name changed successfully", true)
                },
                onError = { _, message ->
                    showCustomToast(this, "Error changing display name: $message", false)
                }
            )
        }

        val backButton = findViewById<ImageButton>(R.id.settings_back_button)
        backButton.setOnClickListener {
            finish()
        }
    }
}