package com.example.biteswipe

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AlertDialog
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat

class FriendsPage : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_friends)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        val backButton: ImageButton = findViewById(R.id.friends_back_button)
        backButton.setOnClickListener {
            finish()
        }

        val addFriendButton: Button = findViewById(R.id.friends_add_friend_button)
        addFriendButton.setOnClickListener {
            val inflater = LayoutInflater.from(this)
            val dialogView: View = inflater.inflate(R.layout.dialog_add_friend, null)
            val dialog = AlertDialog.Builder(this).setView(dialogView).setCancelable(true).create()

            val userName = dialogView.findViewById<EditText>(R.id.add_username)
            val submitButton = dialogView.findViewById<ImageButton>(R.id.add_friend_button)

            submitButton.setOnClickListener {
                val username = userName.text.toString().trim()
                // Add friend logic here
                if(username.isNotEmpty()){
//                    TODO: API Call to add friend
                    Toast.makeText(this, "Friend Request sent to $username", Toast.LENGTH_SHORT).show()
                    dialog.dismiss()
                }
                else{
                    Toast.makeText(this, "Please enter a username", Toast.LENGTH_SHORT).show()
                }
            }

            dialog.show()
        }

        val requestButton = findViewById<ImageButton>(R.id.friend_request_button)
        requestButton.setOnClickListener {

        }

    }
}