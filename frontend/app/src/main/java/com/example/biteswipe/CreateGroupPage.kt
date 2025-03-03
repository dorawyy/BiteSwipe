package com.example.biteswipe

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.location.LocationListener
import android.location.LocationManager
import android.net.Uri
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.adapter.CuisineAdapter
import com.example.biteswipe.cards.CuisineCard

class CreateGroupPage : AppCompatActivity(), LocationListener {
    private val TAG = "CreateGroupPage"
    private lateinit var recyclerView: RecyclerView
    private lateinit var cuisineAdapter: CuisineAdapter
    private lateinit var locationManager: LocationManager
    private var userLocation: Location? = null

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
        setContentView(R.layout.activity_create_group_page)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager





        recyclerView = findViewById(R.id.cuisine_recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this)

        cuisineAdapter = CuisineAdapter(this, cuisines) { cuisine ->
            cuisine.isSelected = !cuisine.isSelected
            if (cuisine.isSelected) {
                selectedCuisines.add(cuisine)
            } else {
                selectedCuisines.remove(cuisine)
            }
        }

        recyclerView.adapter = cuisineAdapter

        if (ActivityCompat.checkSelfPermission(
                this,
                android.Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(
                this,
                android.Manifest.permission.ACCESS_COARSE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            Log.d(TAG, "Permission not granted")
            showSettingsDialog()
            return
        }

        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 10000, 0f, this)

        val createGroupButton = findViewById<Button>(R.id.create_group_button)
        createGroupButton.setOnClickListener {

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

    override fun onLocationChanged(location: Location) {
        userLocation = location
        Log.d(TAG, "Location Changed: ${location.latitude}, ${location.longitude}")
    }

    private fun showSettingsDialog() {
        AlertDialog.Builder(this)
            .setTitle("Enable Location Permission")
            .setMessage("To create a group, please enable location permissions in settings.")
            .setCancelable(false)
            .setPositiveButton("Go to Settings") { _, _ ->
                val intent = Intent(
                    Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.fromParts("package", packageName, null)
                )
                startActivity(intent)
            }
            .setNegativeButton("Back") { _, _ -> finish() }
            .show()
    }

    override fun onDestroy() {
        super.onDestroy()
    }
}
