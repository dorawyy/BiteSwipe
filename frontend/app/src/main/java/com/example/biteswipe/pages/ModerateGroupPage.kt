package com.example.biteswipe.pages

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
import com.example.biteswipe.helpers.ApiHelper
import com.example.biteswipe.R
import com.example.biteswipe.adapter.UserAdapter
import com.example.biteswipe.cards.UserCard
import com.example.biteswipe.helpers.ToastHelper
import com.example.biteswipe.jsonFormats.sessionDetails
import org.json.JSONObject

class ModerateGroupPage : AppCompatActivity(), ApiHelper, ToastHelper {
    private lateinit var users: MutableList<UserCard>
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: UserAdapter
    private lateinit var sessionId: String
    private lateinit var userId: String
    private lateinit var session: sessionDetails
    private lateinit var friends: MutableList<UserCard>
    private lateinit var adapter2: UserAdapter
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

                    val existingUserIds = users.map { it.userId }.toHashSet()
                    val participantIds = session.participants.map { it.userId._id }
                    var index = users.size
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
                                val newIndex = index
                                if(!existingUserIds.contains(userId)) {
                                    users.add(
                                        UserCard(
                                            userName,
                                            R.drawable.ic_group,
                                            userId,
                                            "trash@trash.com"
                                        )
                                    )
                                    adapter.notifyItemInserted(newIndex)
                                    index++
                                }
                            },
                            onError = { code, message ->
                                Log.d(TAG, "Error fetching user details: $message")
                                showCustomToast(this@ModerateGroupPage, "Could not fetch user details", false)
                                val userName = "Loading..."
//                                val profilePicResId = R.drawable.ic_settings
                                val userId = participant.userId._id
                                // Add the UserCard to the list
                                val newIndex = index
                                if(!existingUserIds.contains(userId)) {
                                    users.add(
                                        UserCard(
                                            userName,
                                            R.drawable.ic_settings,
                                            userId,
                                            "trash@trash.com"
                                        )
                                    )
                                    adapter.notifyItemInserted(newIndex)
                                    index++
                                }
                            }
                        )
//                        TODO: Profile Pics
                    }

                    if(session.participants.size < users.size){
                        for(user in users){
                            if(!participantIds.contains(user.userId)){
                                val removeIndex = users.indexOfFirst { it.userId == user.userId }
                                if (removeIndex != -1) {
                                    users.removeAt(removeIndex)
                                    adapter.notifyItemRemoved(removeIndex)
                                }
                            }
                        }
                    }
                },
                onError = { code, message ->
                    Log.d(TAG, "Error fetching users: $message")
                    showCustomToast(this@ModerateGroupPage, "Could not fetch users", false)
                    users = mutableListOf(
                        UserCard("John Doe", R.drawable.ic_settings, "1234567890", "trash@trash.com")
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

        sessionId = intent.getStringExtra("sessionId") ?: ""
        userId = intent.getStringExtra("userId") ?: ""

        if(sessionId == ""){
            showCustomToast(this, "Error: SessionID Invalid", false)
            finish()
        }
        if(userId == ""){
            showCustomToast(this, "Error: Not Logged In", false)
            finish()
        }

//        Session ID for testing
        val testSessionId = findViewById<TextView>(R.id.test_session_id)
        testSessionId.text = sessionId

//        Load Session ID into Text View
        val groupIdText = findViewById<TextView>(R.id.placeholderText)
        groupIdText.text = intent.getStringExtra("joinCode")


        users = mutableListOf()
        recyclerView = findViewById(R.id.user_moderate_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false)
        adapter = UserAdapter(this, users, false) { user -> handleKickUser(user) }
        recyclerView.adapter = adapter
        friends = mutableListOf()
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
            val friendsRecycler = dialogView.findViewById<RecyclerView>(R.id.invite_friends_recycler_view)
            apiRequest(
                context = this,
                endpoint = "/users/$userId",
                method = "GET",
                onSuccess = { response ->
                    Log.d(TAG, "Response: $response")
                    val friendsArray = response.getJSONArray("friendList")
                    friends.clear()
                    friends = mutableListOf()
                    for(i in 0 until friendsArray.length()){
                        val friendJson = friendsArray.getJSONObject(i)
                        val friendEmail = friendJson.getString("email")
                        val friendName = friendJson.getString("displayName")
                        val friendId = friendJson.getString("userId")
                        friends.add(UserCard(friendName, R.drawable.ic_settings, friendId, friendEmail))
                    }
                    runOnUiThread {
                        friendsRecycler.layoutManager =
                            LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false)
                        adapter2 = UserAdapter(this, friends, true) { user -> handleInviteFriend(user) }
                        friendsRecycler.adapter = adapter2
                    }

                }, onError = { _, message ->
                    Log.e(TAG, "Error: $message")
                    friends = mutableListOf(
                        UserCard("person1", R.drawable.ic_settings, "1234567890", "test@test.com"),
                    )
                    runOnUiThread {
                        friendsRecycler.visibility = View.GONE
                    }
                }
            )
            val userIdView = dialogView.findViewById<EditText>(R.id.new_member_text)
            val submitButton = dialogView.findViewById<ImageButton>(R.id.add_member_button)

            submitButton.setOnClickListener {
                val newUserId = userIdView.text.toString().trim()
                if(newUserId.isNotEmpty()){
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
                            showCustomToast(this, "Invitation sent to $newUserId", true)
                            dialog.dismiss()
                        },
                        onError = { code, message ->
                            Log.d(TAG, "Error sending invitation: $message")
                            showCustomToast(this, "Could not send invitation", false)
                        }
                    )
                    dialog.dismiss()
                }
                else{
                    showCustomToast(this, "Please enter a valid username", false)
                }
            }

            dialog.show()
        }
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
                showCustomToast(this, "User ${user.userId} has been kicked from the group", true)
                },
            onError = { code, message ->
                Log.d(TAG, "Error removing User ${user.userId} from Session")
                showCustomToast(this, "Could not remove user", false)
            }
        )

    }

    private fun handleInviteFriend(user: UserCard) {
        val endpoint = "/sessions/$sessionId/invitations"
        val body = JSONObject().apply {
            put("email", user.userEmail)
        }
        apiRequest(
            context = this,
            endpoint = endpoint,
            method = "POST",
            jsonBody = body,
            onSuccess = { response ->
                Log.d(TAG, "Sending invitation to ${user.userName}")
                showCustomToast(this, "Invitation sent to ${user.userName}", true)
            },
            onError = { code, message ->
                Log.d(TAG, "Error sending invitation: $message")
                showCustomToast(this, "Could not send invitation", false)
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