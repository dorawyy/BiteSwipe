package com.example.biteswipe

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
import com.example.biteswipe.adapter.UserAdapter
import com.example.biteswipe.adapter.UserAdapterFriends
import com.example.biteswipe.cards.UserCard

class FriendsPage : AppCompatActivity() {
    private lateinit var adapter: UserAdapterFriends
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter2: UserAdapter
    private lateinit var recyclerView2: RecyclerView
    private lateinit var friends: MutableList<UserCard>
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
//                    TODO: API Call to send friend request
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
            val inflater = LayoutInflater.from(this)
            val dialogView: View = inflater.inflate(R.layout.dialog_friend_requests, null)
            val dialog = AlertDialog.Builder(this)
                .setView(dialogView)
                .setCancelable(true)
                .create()
//            TODO: API Call to get friend requests
            // Dummy list of friend requests
            val users = mutableListOf(
                UserCard("John Doe", R.drawable.ic_settings),
                UserCard("Jane Doe", R.drawable.ic_settings),
                UserCard("Mike Tyson", R.drawable.ic_launcher_background)
            )

            val friendRequestActions = object : FriendRequestActions {
                override fun handleAcceptFriend(user: UserCard) {
                    // TODO: API call to accept friend
                    users.remove(user)
                    adapter.notifyDataSetChanged()
                }

                override fun handleRejectFriend(user: UserCard) {
                    // TODO: API Call to reject friend
                    users.remove(user)
                    adapter.notifyDataSetChanged()
                }
            }

            // Setup RecyclerView and Adapter
            recyclerView = dialogView.findViewById(R.id.friend_request_recycler_view)
            recyclerView.layoutManager = LinearLayoutManager(this)
            adapter = UserAdapterFriends(this, users, friendRequestActions)
            recyclerView.adapter = adapter

            // Show the dialog
            dialog.show()
        }

//        TODO: API Call to get friends
        friends = mutableListOf(
            UserCard("person1", R.drawable.ic_settings),
            UserCard("person2", R.drawable.ic_settings),
            UserCard("person3", R.drawable.ic_launcher_background)
        )
        recyclerView2 = findViewById(R.id.friends_recycler_view)
        recyclerView2.layoutManager = LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false)
        adapter2 = UserAdapter(this, friends) { user -> handleKickUser(user) }
        recyclerView2.adapter = adapter2
        Log.d(TAG, "Set up users")


    }
    fun handleKickUser(user: UserCard) {
//        TODO: API Call to remove friends
        friends.remove(user)
        adapter2.notifyDataSetChanged()
        Toast.makeText(this, "${user.userName} was removed as a friend", Toast.LENGTH_SHORT).show()
    }



}