package com.example.biteswipe

import android.os.Bundle
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.adapter.UserAdapterNoKick

class ViewGroupPage : AppCompatActivity() {
    private lateinit var users: MutableList<UserCard>
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: UserAdapterNoKick
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_view_group_page)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }
//        TODO: Fetch Group Details from Backend
        users = mutableListOf(
            UserCard("John Doe", R.drawable.ic_settings),
            UserCard("Jane Doe", R.drawable.ic_settings),
            UserCard("Mike Tyson", R.drawable.ic_launcher_background)
        )

//        TODO: Implement Dynamic Render
        recyclerView = findViewById(R.id.view_users_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this)
        adapter = UserAdapterNoKick(this, users)
        recyclerView.adapter = adapter

    //        TODO: Implement logic to indicate matching started, and open activity
    }
}