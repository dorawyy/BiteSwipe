package com.example.biteswipe.pages

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.biteswipe.R
import com.example.biteswipe.helpers.ApiHelper
import com.google.firebase.messaging.FirebaseMessaging
import org.json.JSONObject

class HomePage : AppCompatActivity(), ApiHelper {
    private lateinit var userId: String
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        createNotificationChannel()
//      TODO: Configure loading view
//        setContentView(R.layout.loading_page)
        val userEmail = intent.getStringExtra("userEmail") ?: ""
        val userName = intent.getStringExtra("displayName") ?: "Unknown User"
        userId = intent.getStringExtra("userId") ?: ""
        val notificationType = intent.getStringExtra("type")?: ""
        val uniqueId = intent.getStringExtra("uniqueId")?: ""

//        check for auth
        if(userId == ""){
            val intent = Intent(this, LoginPage::class.java).apply {
                putExtra("nextIntent", intent)
                putExtra("notificationType", notificationType)
                putExtra("uniqueId", uniqueId)
            }
            startActivity(intent)
            finish()
        }


//        check for token
        FirebaseMessaging.getInstance().token
            .addOnCompleteListener { task ->
                if (task.isSuccessful) {
                    val token = task.result
                    Log.d("MainActivity", "FCM Token: $token")
                    // Send token to backend
                    if(userId != "") {
                        val endpoint = "/users/$userId/fcm-token"
                        val body = JSONObject().apply {
                            put("fcmToken", token.toString())
                        }
                        apiRequest(
                            context = this,
                            endpoint = endpoint,
                            method = "POST",
                            jsonBody = body,
                            onSuccess = { response ->
                                Log.d("MainActivity", "Firebase Notifs Configured: $response")
                            },
                            onError = { _, message ->
                                Log.e("MainActivity", "Firebase Error: $message")
                            }
                        )
                    }
                }
            }

//        check for notification intent
        if(notificationType != "") {
            if(notificationType == "group") {
//                TODO: Configure group page to auto follow through to viewgrouppage, handle errors accordingly
                val intent = Intent(this, ViewGroupPage::class.java).apply {
                    putExtra("groupId", uniqueId)
                    putExtra("userId", userId)
                    putExtra("userEmail", userEmail)
                }
                startActivity(intent)
            }
            else if(notificationType == "friend") {
                val intent = Intent(this, FriendsPage::class.java).apply {
                    putExtra("userId", userId)
                    putExtra("userEmail", userEmail)
                }
                startActivity(intent)
            }
        }

//        render homepage
        setContentView(R.layout.activity_home_page)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        val tvLoggedInUser = findViewById<TextView>(R.id.welcomeText)


//        FOR TESTING PURPOSES ONLY, save username to temp testing file. Not for use in PROD
        var testUserId = findViewById<TextView>(R.id.test_user_id)
        testUserId.text = userId

        tvLoggedInUser.text = "Welcome,\n$userName!"
        val friendsButton: ImageButton = findViewById(R.id.main_friends_button)
        friendsButton.setOnClickListener {
            val intent = Intent(this, FriendsPage::class.java).apply {
                putExtra("userId", userId)
                putExtra("userEmail", userEmail)
            }
            startActivity(intent)
        }

        val settingsButton: ImageButton = findViewById(R.id.main_settings_button)
        settingsButton.setOnClickListener {
            val intent = Intent(this, SettingsPage::class.java)
            startActivity(intent)
        }

        val joinButton = findViewById<Button>(R.id.main_join_group_button)
        joinButton.setOnClickListener {
            val intent = Intent(this, JoinGroupPage::class.java)
            intent.putExtra("userId", userId)
            intent.putExtra("userEmail", userEmail)
            Log.d("Home Page", "User Email: $userEmail")
            startActivity(intent)
        }

        val createButton = findViewById<Button>(R.id.main_create_group_button)
        createButton.setOnClickListener {
            val intent = Intent(this, CreateGroupPage::class.java)
            intent.putExtra("userId", userId)
            startActivity(intent)
        }


//        TODO: Your Previous Eats
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = getString(R.string.default_notification_channel_name)
            val descriptionText = getString(R.string.default_notification_channel_description)
            val importance = NotificationManager.IMPORTANCE_DEFAULT
            val channel = NotificationChannel(getString(R.string.default_notification_channel_id), name, importance).apply {
                description = descriptionText
            }

            // Register the channel with the system
            val notificationManager: NotificationManager =
                getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            notificationManager.createNotificationChannel(channel)
        }
    }
}