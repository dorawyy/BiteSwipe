package com.example.biteswipe.pages

import android.os.Bundle
import android.util.Log
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
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.R
import com.example.biteswipe.adapter.UserAdapter
import com.example.biteswipe.adapter.UserAdapterFriends
import com.example.biteswipe.cards.UserCard
import com.example.biteswipe.helpers.ApiHelper
import org.json.JSONObject

class FriendsPage : AppCompatActivity(), ApiHelper {
    private lateinit var adapter: UserAdapterFriends
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter2: UserAdapter
    private lateinit var recyclerView2: RecyclerView
    private lateinit var friends: MutableList<UserCard>
    private lateinit var requests: MutableList<UserCard>

    private lateinit var userId: String
    private lateinit var userEmail: String

    interface FriendRequestActions {
        fun handleAcceptFriend(user: UserCard)
        fun handleRejectFriend(user: UserCard)
    }
    private var TAG = "FriendsPage"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_friends)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        userId = intent.getStringExtra("userId") ?: ""
        userEmail = intent.getStringExtra("userEmail") ?: ""

//       Dummy list of friend requests, stops app from complaining
        requests = mutableListOf(
        )

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
                    val body = JSONObject().apply {
                        put("friendEmail", username)
                    }
                    apiRequest(
                        context = this,
                        endpoint = "/users/$userEmail/friendRequest",
                        method = "POST",
                        jsonBody = body,
                        onSuccess = { response ->
                            Log.d(TAG, "Response: $response")
                            Toast.makeText(this, "Friend Request sent to $username", Toast.LENGTH_SHORT).show()
                            dialog.dismiss()
                        },
                        onError = { _, message ->
                            Log.e(TAG, "Error: $message")
                            Toast.makeText(this, "Error: Invalid User", Toast.LENGTH_SHORT).show()
                        }
                    )
                }
                else{
                    Toast.makeText(this, "Please enter a username", Toast.LENGTH_SHORT).show()
                }
            }

            dialog.show()
        }

        val requestButton = findViewById<ImageButton>(R.id.friend_request_button)
        requestButton.setOnClickListener {
            val inflater = LayoutInflater.from(this)
            val dialogView: View = inflater.inflate(R.layout.dialog_friend_requests, null)
            val dialog = AlertDialog.Builder(this)
                .setView(dialogView)
                .setCancelable(true)
                .create()

            val friendRequestActions = object : FriendRequestActions {
                override fun handleAcceptFriend(user: UserCard) {
                    val body = JSONObject().apply {
                        put("friendEmail", user.userEmail)
                    }
                    apiRequest(
                        context = this@FriendsPage,
                        endpoint = "/users/$userEmail/acceptRequest",
                        method = "POST",
                        jsonBody = body,
                        onSuccess = { response ->
                            Log.d(TAG, "Response: $response")
                            Toast.makeText(this@FriendsPage, "Accepted Friend Request!", Toast.LENGTH_SHORT).show()
                            val index = requests.indexOf(user)
                            requests.remove(user)
                            adapter.notifyItemRemoved(index)

                            friends.add(user)
                            adapter2.notifyItemInserted(friends.size - 1)

                        },
                        onError = { _, message ->
                            Log.e(TAG, "Error: $message")
                            Toast.makeText(this@FriendsPage, "Server Error", Toast.LENGTH_SHORT).show()
                        }
                    )

                }

                override fun handleRejectFriend(user: UserCard) {
                    val body = JSONObject().apply {
                        put("friendEmail", user.userEmail)
                    }
                    apiRequest(
                        context = this@FriendsPage,
                        endpoint = "/users/$userEmail/rejectRequest",
                        method = "POST",
                        jsonBody = body,
                        onSuccess = { response ->
                            Log.d(TAG, "Response: $response")
                            Toast.makeText(this@FriendsPage, "Rejected Friend Request", Toast.LENGTH_SHORT).show()
                            val index = requests.indexOf(user)
                            requests.remove(user)
                            adapter.notifyItemRemoved(index)
                        },
                        onError = { _, message ->
                            Log.e(TAG, "Error: $message")
                            Toast.makeText(this@FriendsPage, "Server Error", Toast.LENGTH_SHORT).show()
                        }
                    )

                }
            }

            // Setup RecyclerView and Adapter
            recyclerView = dialogView.findViewById(R.id.friend_request_recycler_view)
            recyclerView.layoutManager = LinearLayoutManager(this)
            adapter = UserAdapterFriends(this, requests, friendRequestActions)
            recyclerView.adapter = adapter

            // Show the dialog
            dialog.show()
        }
        requestButton.visibility = View.INVISIBLE

//        update friends, friend requests
        apiRequest(
            context = this,
            endpoint = "/users/$userId",
            method = "GET",
            onSuccess = { response ->
                Log.d(TAG, "Response: $response")
                val friendsArray = response.getJSONArray("friendList")
                val requestsArray = response.getJSONArray("pendingRequest")
                friends.clear()
                requests.clear()
                friends = mutableListOf()
                for(i in 0 until friendsArray.length()){
                    val friendJson = friendsArray.getJSONObject(i)
                    val friendEmail = friendJson.getString("email")
                    val friendName = friendJson.getString("displayName")
                    val friendId = friendJson.getString("userId")
                    friends.add(UserCard(friendName, R.drawable.ic_settings, friendId, friendEmail))
                }
                requests = mutableListOf()
                for (i in 0 until requestsArray.length()) {
                    val requestJson = requestsArray.getJSONObject(i)
                    val requestEmail = requestJson.getString("email")
                    val requestName = requestJson.getString("displayName")
                    val requestId = requestJson.getString("userId")

                    requests.add(UserCard(requestName, R.drawable.ic_settings, requestId, requestEmail))
                }
                runOnUiThread {
                    recyclerView2 = findViewById(R.id.friends_recycler_view)
                    recyclerView2.layoutManager =
                        LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false)
                    adapter2 = UserAdapter(this, friends, false) { user -> handleRemoveFriend(user) }
                    recyclerView2.adapter = adapter2


                    requestButton.visibility = View.VISIBLE
                }

            }, onError = { _, message ->
                Log.e(TAG, "Error: $message")
                friends = mutableListOf(
                    UserCard("person1", R.drawable.ic_settings, "1234567890", "test@test.com"),
                )
                runOnUiThread {
                    recyclerView2 = findViewById(R.id.friends_recycler_view)
                    recyclerView2.layoutManager =
                        LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false)
                    adapter2 = UserAdapter(this, friends, false) { user -> handleRemoveFriend(user) }
                    recyclerView2.adapter = adapter2
                }
            }
        )
        friends = mutableListOf()
        if(::friends.isInitialized) {
            recyclerView2 = findViewById(R.id.friends_recycler_view)
            recyclerView2.layoutManager =
                LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false)
            adapter2 = UserAdapter(this, friends, false) { user -> handleRemoveFriend(user) }
            recyclerView2.adapter = adapter2
            Log.d(TAG, "Set up users")
        }


    }
    private fun handleRemoveFriend(user: UserCard) {
        val body = JSONObject().apply {
            put("friendEmail", user.userEmail)
        }
        apiRequest(
            context = this@FriendsPage,
            endpoint = "/users/$userEmail/removeFriend",
            method = "DELETE",
            jsonBody = body,
            onSuccess = { response ->
                Log.d(TAG, "Response: $response")
                val index = friends.indexOf(user)
                friends.remove(user)
                adapter2.notifyItemRemoved(index)
                Toast.makeText(this, "${user.userName} was removed as a friend", Toast.LENGTH_SHORT).show()
            },
            onError = { _, message ->
                Log.e(TAG, "Error: $message")
                Toast.makeText(this@FriendsPage, "Server Error", Toast.LENGTH_SHORT).show()
            }
        )
    }



}