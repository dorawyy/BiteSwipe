package com.example.biteswipe

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.ImageButton
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class CreateGroupPage : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_create_group_page)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        val createGroupButton = findViewById<Button>(R.id.create_group_button)
        createGroupButton.setOnClickListener {
//            TODO: Read Values from inputs
//            TODO: API call to Create Group
//            TODO: Send Group Creator to Backend
//            TODO: Open ModerateGroupPage Activity
            val intent = Intent(this, ModerateGroupPage::class.java)
            startActivity(intent)
        }

        val backButton: ImageButton = findViewById(R.id.create_back_button)
        backButton.setOnClickListener {
            finish()
        }
    }
}
