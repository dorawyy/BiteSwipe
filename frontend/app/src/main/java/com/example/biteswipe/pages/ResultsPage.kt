package com.example.biteswipe.pages

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
import com.example.biteswipe.helpers.ApiHelper
import com.example.biteswipe.R
import com.example.biteswipe.adapter.SwipeAdapter
import com.example.biteswipe.cards.RestaurantCard

class ResultsPage : AppCompatActivity(), ApiHelper {
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: SwipeAdapter
    private lateinit var sessionId: String
    private lateinit var userId: String
    private var matchType: Boolean = false
    private lateinit var restaurantList: MutableList<RestaurantCard>
    private val TAG = "ResultsPage"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(R.layout.activity_results_page)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        sessionId = intent.getStringExtra("sessionId") ?: ""
        userId = intent.getStringExtra("userId") ?: ""
        matchType = intent.getBooleanExtra("singleMatch", false)
        restaurantList = mutableListOf()


        recyclerView = findViewById(R.id.results_recycler_view)
        recyclerView.layoutManager =
            LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        adapter = SwipeAdapter(this, restaurantList)
        recyclerView.adapter = adapter

        if(!matchType) {
            val endpoint = "/sessions/$sessionId/result"
            apiRequest(
                context = this,
                endpoint = endpoint,
                method = "GET",
                onSuccess = { response ->
                    val restaurants = parseRestaurants(response.toString())
                    for(restaurant in restaurants) {
                        val restaurantName = restaurant.name
                        val imageResId = restaurant.picture
                        val address = restaurant.address
                        val contact = restaurant.contactNumber
                        val price = restaurant.price
                        val rating = restaurant.rating
                        val restaurantId = restaurant.restaurantId

                        // Add the UserCard to the list
                        restaurantList.add(
                            RestaurantCard(
                                restaurantName,
                                imageResId,
                                address,
                                contact,
                                price,
                                rating,
                                restaurantId
                            ),
                        )
                    }

                    adapter.notifyDataSetChanged()
                },
                onError = { code, message ->
                    Log.d(TAG, "Error: $code, $message")
                    Toast.makeText(this, "Error: $code, $message", Toast.LENGTH_SHORT).show()
                }
            )
        } else {

            val potentialRestaurant = intent.getStringExtra("potentialRestaurant")?: ""
            val restaurant = parseRestaurant(potentialRestaurant)

            val restaurantName = restaurant.name
            val imageResId = restaurant.picture
            val address = restaurant.address
            val contact = restaurant.contactNumber
            val price = restaurant.price
            val rating = restaurant.rating
            val restaurantId = restaurant.restaurantId

            // Add the UserCard to the list
            restaurantList.add(
                RestaurantCard(
                    restaurantName,
                    imageResId,
                    address,
                    contact,
                    price,
                    rating,
                    restaurantId
                ),
            )

            adapter.notifyDataSetChanged()

        }

        val exitButton = findViewById<Button>(R.id.back_to_home_button)
        exitButton.setOnClickListener {
            Log.d(TAG, "Exiting Session")
            finish()
        }

    }
}