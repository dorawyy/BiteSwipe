package com.example.biteswipe

import android.content.Intent
import android.os.Bundle
import android.widget.Button
import android.widget.ImageButton
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.example.biteswipe.R.*

class JoinGroupPage : AppCompatActivity() {
    private lateinit var sessionId: String
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(layout.activity_join_group_page)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        val joinButton = findViewById<Button>(id.join_button)
        joinButton.setOnClickListener {
            // TODO: API Call to Join Group
//            TODO: On success, Open view group activity. Pass groupid into intent
            val intent = Intent(this, ViewGroupPage::class.java)
//              SAMPLE WAY TO PASS GROUP INTO ACTIVITY
//            intent.putExtra("sessionId", sessionId)
            startActivity(intent)
        }

        val backButton: ImageButton = findViewById(id.join_back_button)
        backButton.setOnClickListener {
            finish()
        }


    }
}