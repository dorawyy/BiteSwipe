package com.example.biteswipe

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.ImageButton
import android.widget.TextView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class HomePage : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_home_page)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
        val tvLoggedInUser = findViewById<TextView>(R.id.welcomeText)

        val userName = intent.getStringExtra("displayName") ?: "Unknown User"
        tvLoggedInUser.text = "Welcome,\n$userName!"

        val friendsButton: ImageButton = findViewById(R.id.main_friends_button)
        friendsButton.setOnClickListener {
            val intent = Intent(this, FriendsPage::class.java)
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
            startActivity(intent)
        }

        val createButton = findViewById<Button>(R.id.main_create_group_button)
        createButton.setOnClickListener {
            val intent = Intent(this, CreateGroupPage::class.java)
            startActivity(intent)
        }


//        TODO: Your Previous Eats
    }
}