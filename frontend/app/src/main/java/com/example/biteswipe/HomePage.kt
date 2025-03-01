package com.example.biteswipe

import android.content.Intent
import android.os.Bundle
import android.widget.Button
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
//        TODO: Link Buttons to Respective Activities
        val joinButton = findViewById<Button>(R.id.main_join_group_button)
        joinButton.setOnClickListener {
            // Handle button click
            val intent = Intent(this, JoinGroupPage::class.java)
            startActivity(intent)
        }

        val createButton = findViewById<Button>(R.id.main_create_group_button)
        createButton.setOnClickListener {
            val intent = Intent(this, CreateGroupPage::class.java)
            startActivity(intent)
        }

    }
}