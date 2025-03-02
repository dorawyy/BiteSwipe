package com.example.biteswipe

import android.os.Bundle
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
import org.json.JSONObject

class ViewGroupPage : AppCompatActivity(), ApiHelper {
    private lateinit var users: MutableList<UserCard>
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: UserAdapterNoKick
    private lateinit var sessionId: String
    private lateinit var userId: String
    private lateinit var session: sessionDetails

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

//        TODO: API Call to fetch users from backend (PERSISTENT)
//        TODO: Make this call repeat over intervals to get a clear list of users (thread?)
        val endpoint = "/sessions/$sessionId"
        apiRequest(
            context = this,
            endpoint = endpoint,
            method = "GET",
            onSuccess = { response ->
                session  = parseSessionData(response)
                Log.d("ViewGroupPage", "Session Details: $session")
            }
        )
        if(!session.participants.isEmpty()){
            users.clear()
            for (participant in session.participants) {
                val userName = participant.userId.displayName // Access the displayName of the user
                val profilePicResId = R.drawable.ic_settings // Assuming you have a default image here

                // Add the UserCard to the list
                users.add(UserCard(userName, profilePicResId, participant.userId._id) )
            }
        }
        else {
            users = mutableListOf(
                UserCard("John Doe", R.drawable.ic_settings, "1234567890"),
                UserCard("Jane Doe", R.drawable.ic_settings, "0987654321"),
                UserCard("Mike Tyson", R.drawable.ic_launcher_background, "1111111111")
            )
        }

//        TODO: Implement Dynamic Render
        recyclerView = findViewById(R.id.view_users_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this)
        adapter = UserAdapterNoKick(this, users)
        recyclerView.adapter = adapter


        val leaveGroupButton = findViewById<ImageButton>(R.id.leave_group_button)
        leaveGroupButton.setOnClickListener {
            val epoint = "/sessions/$sessionId/participants/$userId"
            apiRequest(
                context = this,
                endpoint = epoint,
                method = "DELETE",
                onSuccess = { response ->
                    Log.d("ViewGroupPage", "Removing user $userId from Session $sessionId")
                    finish()
                },
                onError = { code, message ->
                    Log.d("ViewGroupPage", "Error removing User $userId from Session $sessionId: \n $message")
                    Toast.makeText(this, "Could not remove user", Toast.LENGTH_SHORT).show()
                }
            )
        }


    //        TODO: Implement logic to indicate matching started, and open activity
//        TODO: API Call to start matching
    }
}