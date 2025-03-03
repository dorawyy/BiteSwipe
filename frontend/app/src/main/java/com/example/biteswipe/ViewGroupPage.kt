package com.example.biteswipe

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.widget.ImageButton
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.adapter.UserAdapterNoKick
import com.example.biteswipe.cards.UserCard
import com.example.biteswipe.jsonFormats.sessionDetails

class ViewGroupPage : AppCompatActivity(), ApiHelper {
    private lateinit var users: MutableList<UserCard>
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: UserAdapterNoKick
    private lateinit var sessionId: String
    private lateinit var userId: String
    private lateinit var session: sessionDetails
    private var sessionInitialized = false
    private val handler = Handler(Looper.getMainLooper())
    private val updateUsers = object: Runnable {
        override fun run() {
//            TODO: In this function, implement the logic that takes us to start matching.
//            Ensure that handler dies after starting new activity

            val endpoint = "/sessions/$sessionId"
            apiRequest(
                context = this@ViewGroupPage,
                endpoint = endpoint,
                method = "GET",
                onSuccess = { response ->
                    session = parseSessionData(response)
                    Log.d(TAG, "Session Details: $session")
                    if(session.status == "MATCHING") {
                        Log.d(TAG, "Starting Matching")
                        Toast.makeText(this@ViewGroupPage, "Starting Matching", Toast.LENGTH_SHORT).show()
                        val intent = Intent(this@ViewGroupPage, MatchingPage::class.java)
                        intent.putExtra("userId", userId)
                        intent.putExtra("sessionId", sessionId)
                        startActivity(intent)
                        finish()
                    }
//                    update users
                    users.clear()
                    for (participant in session.participants) {
                        Log.d(TAG, "Participant: $participant")
                        val epoint = "/users/${participant.userId._id}"
                        apiRequest(
                            context = this@ViewGroupPage,
                            endpoint = epoint,
                            method = "GET",
                            onSuccess = { response2 ->
                                Log.d(TAG, "User Details: ${response2.getString("displayName")}")
                                val userName = response2.getString("displayName")
//                                val profilePicResId = R.drawable.ic_settings // Assuming you have a default image here
                                val userId = participant.userId._id
                                // Add the UserCard to the list
                                users.add(UserCard(userName, R.drawable.ic_group, userId))
                                adapter.notifyDataSetChanged()
                            },
                            onError = { code, message ->
                                Log.d(TAG, "Error fetching user details: $message")
                                Toast.makeText(
                                    this@ViewGroupPage,
                                    "Could not fetch user details",
                                    Toast.LENGTH_SHORT
                                ).show()
                                val userName = "Loading..."
//                                val profilePicResId = R.drawable.ic_settings
                                val userId = participant.userId._id
                                // Add the UserCard to the list
                                users.add(UserCard(userName, R.drawable.ic_settings, userId))
                                adapter.notifyDataSetChanged()
                            }
                        )
//                        TODO: Profile Pics
                    }
                },
                onError = { code, message ->
                    Log.d(TAG, "Error fetching users: $message")
                    Toast.makeText(
                        this@ViewGroupPage,
                        "Could not fetch users",
                        Toast.LENGTH_SHORT
                    ).show()
                    users = mutableListOf(
                        UserCard("John Doe", R.drawable.ic_settings, "1234567890"),
                        UserCard("Jane Doe", R.drawable.ic_settings, "0987654321"),
                        UserCard("Mike Tyson", R.drawable.ic_launcher_background, "1111111111")
                    )
                    adapter.notifyDataSetChanged()
                }
            )
            handler.postDelayed(this, 5000)
        }
    }
    private var TAG = "ViewGroupPage"


    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_view_group_page)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        sessionId = intent.getStringExtra("sessionId") ?: ""
        if(sessionId == ""){
            Toast.makeText(this, "Error: SessionID Invalid", Toast.LENGTH_SHORT).show()
            finish()
        }

        userId = intent.getStringExtra("userId") ?: ""
        if(userId == ""){
            Toast.makeText(this, "Error: Not Logged In", Toast.LENGTH_SHORT).show()
            finish()
        }


        users = mutableListOf()
        recyclerView = findViewById(R.id.view_users_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this)
        adapter = UserAdapterNoKick(this, users)
        recyclerView.adapter = adapter

        updateUsers()

        val leaveGroupButton = findViewById<ImageButton>(R.id.leave_group_button)
        leaveGroupButton.setOnClickListener {
            val epoint = "/sessions/$sessionId/participants/$userId"
            apiRequest(
                context = this,
                endpoint = epoint,
                method = "DELETE",
                onSuccess = { response ->
                    Log.d("ViewGroupPage", "Removing user $userId from Session $sessionId")
                    Toast.makeText(this, "Left Group", Toast.LENGTH_SHORT).show()
                    finish()
                },
                onError = { code, message ->
                    Log.d("ViewGroupPage", "Error removing User $userId from Session $sessionId: \n $message")
                    Toast.makeText(this, "Could not remove user", Toast.LENGTH_SHORT).show()
                }
            )
        }
    }

    private fun updateUsers() {
        handler.post(updateUsers)
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(updateUsers)
    }
}