package com.example.biteswipe

import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.adapter.UserAdapter
import com.example.biteswipe.cards.UserCard
import com.example.biteswipe.jsonFormats.sessionDetails
import org.json.JSONObject

class ModerateGroupPage : AppCompatActivity(), ApiHelper {
    private lateinit var users: MutableList<UserCard>
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: UserAdapter
    private lateinit var sessionId: String
    private lateinit var userId: String
    private lateinit var session: sessionDetails
    private val handler = Handler(Looper.getMainLooper())
    private val updateUsers = object: Runnable {
        override fun run() {
            val endpoint = "/sessions/$sessionId"
            apiRequest(
                context = this@ModerateGroupPage,
                endpoint = endpoint,
                method = "GET",
                onSuccess = { response ->
                    session  = parseSessionData(response)
                    Log.d(TAG, "Session Details: $session")
                    users.clear()
                    for (participant in session.participants) {
                        Log.d(TAG, "Participant: $participant")
                        val epoint = "/users/${participant.userId._id}"
                        apiRequest(
                            context = this@ModerateGroupPage,
                            endpoint = epoint,
                            method = "GET",
                            onSuccess = { response ->
                                Log.d(TAG, "User Details: ${response.getString("displayName")}")
                                val userName = response.getString("displayName")
//                                val profilePicResId = R.drawable.ic_settings // Assuming you have a default image here
                                val userId = participant.userId._id
                                // Add the UserCard to the list
                                users.add(UserCard(userName, R.drawable.ic_group, userId))
                                adapter.notifyDataSetChanged()
                            },
                            onError = { code, message ->
                                Log.d(TAG, "Error fetching user details: $message")
                                Toast.makeText(this@ModerateGroupPage, "Could not fetch user details", Toast.LENGTH_SHORT).show()
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
                    Toast.makeText(this@ModerateGroupPage, "Could not fetch users", Toast.LENGTH_SHORT).show()
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

//        Session ID for testing
        val testSessionId = findViewById<TextView>(R.id.test_session_id)
        testSessionId.text = sessionId

//        Load Session ID into Text View
        val groupIdText = findViewById<TextView>(R.id.placeholderText)
        groupIdText.text = intent.getStringExtra("joinCode")


//        TODO: Implement Dynamic Rendering of Users
        users = mutableListOf()
        recyclerView = findViewById(R.id.user_moderate_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false)
        adapter = UserAdapter(this, users) { user -> handleKickUser(user) }
        recyclerView.adapter = adapter
        Log.d(TAG, "Set up users")

        updateUsers()

        val startMatchingButton = findViewById<Button>(R.id.start_matching_button)
        startMatchingButton.setOnClickListener {
            val endpoint = "/sessions/$sessionId/start"
            val body = JSONObject().apply {
                put("userId",userId)
                put("time", 5)
            }
            apiRequest(
                context = this,
                endpoint = endpoint,
                method = "POST",
                jsonBody = body,
                onSuccess = { response ->
                    Log.d(TAG, "Starting Matching")
                    val intent = Intent(this, MatchingPage::class.java)
                    intent.putExtra("userId", userId)
                    intent.putExtra("sessionId", sessionId)
                    startActivity(intent)
                    finish()
                },

            )
        }

        val shareButton = findViewById<ImageButton>(R.id.share_group_button)
        shareButton.setOnClickListener {
            val inflater = LayoutInflater.from(this)
            val dialogView: View = inflater.inflate(R.layout.dialog_add_member, null)
            val dialog = AlertDialog.Builder(this).setView(dialogView).setCancelable(true).create()

            val userIdView = dialogView.findViewById<EditText>(R.id.new_member_text)
            val submitButton = dialogView.findViewById<ImageButton>(R.id.add_member_button)

            submitButton.setOnClickListener {
                val newUserId = userIdView.text.toString().trim()
                // Add friend logic here
                if(newUserId.isNotEmpty()){
//                    TODO: API Call to send friend invitation
                    val endpoint = "/sessions/$sessionId/invitations"
                    val body = JSONObject().apply {
                        put("email", newUserId)
                    }
                    apiRequest(
                        context = this,
                        endpoint = endpoint,
                        method = "POST",
                        jsonBody = body,
                        onSuccess = { response ->
                            Log.d(TAG, "Sending invitation to $newUserId")
                            Toast.makeText(this, "Invitation sent to $newUserId", Toast.LENGTH_SHORT).show()
                            dialog.dismiss()
                        },
                        onError = { code, message ->
                            Log.d(TAG, "Error sending invitation: $message")
                            Toast.makeText(this, "Could not send invitation", Toast.LENGTH_SHORT).show()
                        }
                    )
                    dialog.dismiss()
                }
                else{
                    Toast.makeText(this, "Please enter a username", Toast.LENGTH_SHORT).show()
                }
            }

            dialog.show()
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

    private fun updateUsers() {
        handler.post(updateUsers)
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(updateUsers)
    }
}