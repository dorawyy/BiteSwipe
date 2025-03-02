package com.example.biteswipe

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.adapter.UserAdapter
import com.example.biteswipe.cards.UserCard
import com.example.biteswipe.jsonFormats.sessionDetails

class ModerateGroupPage : AppCompatActivity(), ApiHelper {
    private lateinit var users: MutableList<UserCard>
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: UserAdapter
    private lateinit var sessionId: String
    private lateinit var userId: String
    private lateinit var session: sessionDetails
    private var TAG = "ModerateGroupPage"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_moderate_group_page)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
//        TODO: API Call to fetch users from backend (PERSISTENT)
        sessionId = intent.getStringExtra("sessionId") ?: ""
        userId = intent.getStringExtra("userId") ?: ""
        if(sessionId == ""){
            Toast.makeText(this, "Error: SessionID Invalid", Toast.LENGTH_SHORT).show()
            finish()
        }
        if(userId == ""){
            Toast.makeText(this, "Error: Not Logged In", Toast.LENGTH_SHORT).show()
            finish()
        }

        val endpoint = "/sessions/$sessionId"
        apiRequest(
            context = this,
            endpoint = endpoint,
            method = "GET",
            onSuccess = { response ->
                session  = parseSessionData(response)
                Log.d(TAG, "Session Details: $session")
            }
        )
        if(session.participants.isNotEmpty()){
            users.clear()
            for (participant in session.participants) {
                val userName = participant.userId.displayName // Access the displayName of the user
                val profilePicResId = R.drawable.ic_settings // Assuming you have a default image here
                val userId = participant.userId._id
                // Add the UserCard to the list
                users.add(UserCard(userName, profilePicResId, userId))
            }
        }
        else {
            users = mutableListOf(
                UserCard("John Doe", R.drawable.ic_settings, "1234567890"),
                UserCard("Jane Doe", R.drawable.ic_settings, "0987654321"),
                UserCard("Mike Tyson", R.drawable.ic_launcher_background, "1111111111")
            )
        }

//        TODO: Implement Dynamic Rendering of Users
        recyclerView = findViewById(R.id.user_moderate_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false)
        adapter = UserAdapter(this, users) { user -> handleKickUser(user) }
        recyclerView.adapter = adapter

        Log.d(TAG, "Set up users")
        val startMatchingButton = findViewById<Button>(R.id.start_matching_button)
        startMatchingButton.setOnClickListener {
            val intent = Intent(this, MatchingPage::class.java)
//            TODO: API Call to start matching
            startActivity(intent)
        }
//        TODO: Delete Group Button
    }

    private fun handleKickUser(user: UserCard) {
//        On confirmation, remove user from the list
        val endpoint = "/sessions/$sessionId/participants/${user.userId}"
        apiRequest(
            context = this,
            endpoint = endpoint,
            method = "DELETE",
            onSuccess = { response ->
                users.remove(user)
                adapter.notifyDataSetChanged()
                Log.d(TAG, "Removing user ${user.userId} from Session $sessionId")
                Toast.makeText(this, "User ${user.userId} has been kicked from the group.", Toast.LENGTH_SHORT).show()
                },
            onError = { code, message ->
                Log.d(TAG, "Error removing User ${user.userId} from Session")
                Toast.makeText(this, "Could not remove user", Toast.LENGTH_SHORT).show()
            }
        )

    }
}