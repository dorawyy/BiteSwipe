package com.example.biteswipe

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.adapter.CuisineAdapter
import com.example.biteswipe.cards.CuisineCard

class CreateGroupPage : AppCompatActivity() {
    private val TAG = "CreateGroupPage"
    private lateinit var recyclerView: RecyclerView
    private lateinit var cuisineAdapter: CuisineAdapter
    private val cuisines = mutableListOf(
        CuisineCard("Italian", false),
        CuisineCard("Chinese", false),
        CuisineCard("Indian", false),
        CuisineCard("Mexican", false),
        CuisineCard("Japanese", false),
        CuisineCard("French", false),
        CuisineCard("Spanish", false),
        CuisineCard("American", false),
        CuisineCard("Mediterranean", false),
        CuisineCard("Thai", false),
        CuisineCard("Vietnamese", false),
        CuisineCard("Korean", false),
        CuisineCard("Caribbean", false),
        CuisineCard("European", false),
    )
    private val selectedCuisines = mutableListOf<CuisineCard>()
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_create_group_page)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        recyclerView = findViewById(R.id.cuisine_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this)
//        read values from selecter, store them in selectedCuisines
        cuisineAdapter = CuisineAdapter(this, cuisines) { cuisine ->
            cuisine.isSelected = !cuisine.isSelected

            if (cuisine.isSelected) {
                selectedCuisines.add(cuisine)
            } else {
                selectedCuisines.remove(cuisine)
            }

        }
        recyclerView.adapter = cuisineAdapter
        val createGroupButton = findViewById<Button>(R.id.create_group_button)
        createGroupButton.setOnClickListener {
//            TODO: Get User Location
//            TODO: API call to Create Group
//            TODO: Send Group Creator to Backend
//            TODO: Open ModerateGroupPage Activity
            val selectedCuisineNames = selectedCuisines.joinToString { it.name }
            val searchRadius = findViewById<EditText>(R.id.searchRadiusText).text.toString()
            Log.d(TAG, "Selected cuisines: $selectedCuisineNames \n Search Radius: $searchRadius")
            val intent = Intent(this, ModerateGroupPage::class.java)
            startActivity(intent)
        }

        val backButton: ImageButton = findViewById(R.id.create_back_button)
        backButton.setOnClickListener {
            finish()
        }
    }
}
