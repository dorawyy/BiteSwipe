package com.example.biteswipe

import android.os.Bundle
import android.util.Log
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.adapter.SwipeAdapter
import com.example.biteswipe.adapter.UserAdapter

class ModerateGroupPage : AppCompatActivity() {
    private lateinit var users: MutableList<UserCard>
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: UserAdapter
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
//        TODO: Replace current users with data fetched from backend
        users = mutableListOf(
            UserCard("John Doe", R.drawable.ic_settings),
            UserCard("Jane Doe", R.drawable.ic_settings),
            UserCard("Mike Tyson", R.drawable.ic_launcher_background)
        )
//        TODO: Implement Dynamic Rendering of Users
        recyclerView = findViewById(R.id.user_moderate_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this, LinearLayoutManager.VERTICAL, false)
        adapter = UserAdapter(this, users)
        recyclerView.adapter = adapter
        Log.d(TAG, "Set up users")
//        TODO: Start Matching Button
//        TODO: Kick User Button
//        TODO: Delete Group Button
    }
}