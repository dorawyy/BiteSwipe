package com.example.biteswipe

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.biteswipe.R.*
import com.example.biteswipe.jsonFormats.sessionDetails
import org.json.JSONObject

class JoinGroupPage : AppCompatActivity(), ApiHelper {
    private lateinit var sessionId: String
    private lateinit var userId: String
    private lateinit var session: sessionDetails
    private val TAG = "JoinGroupPage"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(layout.activity_join_group_page)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        userId = intent.getStringExtra("userId") ?: ""
        val userIdText = findViewById<TextView>(id.join_user_id_text)
        userIdText.text = userId
        Log.d(TAG, "User ID: $userId")
        val joinButton = findViewById<Button>(id.join_button)
        joinButton.setOnClickListener {
            val sessionToJoin = findViewById<EditText>(id.group_id_input).text.toString()
            val endpoint = "/sessions/$sessionToJoin/participants"
            val body = JSONObject().apply {
                    put("userId", userId)
            }
            apiRequest(
                context = this,
                endpoint = endpoint,
                method = "POST",
                jsonBody = body,
                onSuccess = { response ->
                    Log.d(TAG, "Response: $response")
                    Log.d(TAG, "Creator: ${response.getString("creator")}")
                    session = parseSessionData(response)
                    sessionId = session._id
                    val intent = Intent(this, ViewGroupPage::class.java)
                    intent.putExtra("sessionId", sessionId)
                    intent.putExtra("userId", userId)
                    startActivity(intent)
                },
                onError = { code, message ->
                    Toast.makeText(this, "Invalid Group Code", Toast.LENGTH_SHORT).show()
                    Log.d(TAG, "Error joining group: $message")
                }
            )

        }

        val backButton: ImageButton = findViewById(id.join_back_button)
        backButton.setOnClickListener {
            finish()
        }


    }
}