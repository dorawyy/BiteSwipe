package com.example.biteswipe.pages

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.Toast

import androidx.activity.result.contract.ActivityResultContracts

import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.helpers.ApiHelper
import com.example.biteswipe.R
import com.example.biteswipe.adapter.CuisineAdapter
import com.example.biteswipe.cards.CuisineCard
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.material.chip.Chip
import com.google.android.material.chip.ChipGroup
import org.json.JSONObject

class CreateGroupPage : AppCompatActivity(), ApiHelper {
    private val TAG = "CreateGroupPage"
    private lateinit var recyclerView: RecyclerView
    private lateinit var cuisineAdapter: CuisineAdapter
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var locationCallback: LocationCallback

    private var latitude  = 0.0
    private var longitude = 0.0
    private lateinit var userId: String

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
    private val selectedCuisines = mutableListOf<String>()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_create_group_page)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

//        Load global variables
        userId = intent.getStringExtra("userId") ?: ""

        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)



//        Set up Cuisines
//        Find the ChipGroup in your layout
        val cuisineChipGroup = findViewById<ChipGroup>(R.id.cuisine_chip_group)

// Clear existing chips (optional safety)
        cuisineChipGroup.removeAllViews()

// Dynamically add chips based on your cuisines list
        val selectedCuisines = mutableSetOf<String>()

        cuisines.forEach { cuisine ->
            val chip = Chip(this).apply {
                text = cuisine.name
                isCheckable = true
                isChecked = cuisine.isSelected

                setOnCheckedChangeListener { _, isChecked ->
                    cuisine.isSelected = isChecked

                    if (isChecked) {
                        selectedCuisines.add(cuisine.name)
                    } else {
                        selectedCuisines.remove(cuisine.name)
                    }

                    Log.d(TAG, "selected cuisines: $selectedCuisines")
                }
            }

            // Add the chip to your ChipGroup
            cuisineChipGroup.addView(chip)
        }


// Request location updates
        Log.d(TAG, "Checking permissions")
        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED && ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_COARSE_LOCATION
            ) != PackageManager.PERMISSION_GRANTED
        ) {
            requestLocationPermission.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        } else {
            Log.d(TAG, "Starting Location Updates")
            startLocationUpdates()
        }


        val createGroupButton = findViewById<Button>(R.id.create_group_button)
        createGroupButton.setOnClickListener {
            if(selectedCuisines.isEmpty()){
                Toast.makeText(this, "Please select at least one cuisine", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }
            val searchRadius = (((findViewById<EditText>(R.id.searchRadiusText).text)).toString().toFloat() * 1000).toString()

            val endpoint = "/sessions/"
//            TODO: body for cuisine preferences (API)
            val body = JSONObject().apply {
                put("userId", userId)
                put("latitude", latitude)
                put("longitude", longitude)
                put("radius", searchRadius)
            }
            apiRequest(
                context = this,
                endpoint = endpoint,
                method = "POST",
                jsonBody = body,
                onSuccess = { response ->
                    val intent = Intent(this, ModerateGroupPage::class.java)
                    intent.putExtra("sessionId", response.getString("_id"))
                    intent.putExtra("joinCode", response.getString("joinCode"))
                    intent.putExtra("userId", userId)
                    fusedLocationClient.removeLocationUpdates(locationCallback)
                    startActivity(intent)
                    finish()
                },
                onError = { code, message ->
                    Toast.makeText(this, "Could not make Group, try again", Toast.LENGTH_SHORT).show()
                    Log.d(TAG, "Error: $message")
                }
            )
        }

        val backButton: ImageButton = findViewById(R.id.create_back_button)
        backButton.setOnClickListener {
            fusedLocationClient.removeLocationUpdates(locationCallback)
            finish()
        }
    }

    private fun startLocationUpdates() {
        val locationRequest = LocationRequest.create().apply {
            priority = Priority.PRIORITY_HIGH_ACCURACY
            interval = 10000 // 10 seconds
            fastestInterval = 5000 // 5 seconds
        }

        // Location callback to handle location updates
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    latitude = location.latitude
                    longitude = location.longitude
                    Log.d(TAG, "Location Changed: Latitude: $latitude, Longitude: $longitude")
                }
            }
        }

        Log.d(TAG, "Requesting Location Updates")
        fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, null)
    }

    private val requestLocationPermission =
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { isGranted ->
            if (isGranted) {
                startLocationUpdates()
            } else {
                Toast.makeText(this, "Location permission is required.", Toast.LENGTH_SHORT).show()
                showSettingsDialog()
            }
        }

    private fun showSettingsDialog() {
        Log.d(TAG, "Location Result: ${ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION)}")
        AlertDialog.Builder(this)
            .setTitle("Enable Location Permission")
            .setMessage("To create a group, please enable location permissions in settings.")
            .setCancelable(false)
            .setPositiveButton("OK") { _, _ ->
                Log.d(TAG, "Requesting Permissions")
                requestPermissions(
                    arrayOf(Manifest.permission.ACCESS_COARSE_LOCATION,
                        Manifest.permission.ACCESS_FINE_LOCATION
                    ), 0
                )
            }
            .setNegativeButton("Back") { _, _ ->
                Toast.makeText(this, "Please grant location permissions", Toast.LENGTH_SHORT).show()
                finish() }
            .show()
    }

    override fun onDestroy() {
        super.onDestroy()
        fusedLocationClient.removeLocationUpdates(locationCallback)
        // Stop location updates when the activity is destroyed to avoid unnecessary resource usage
    }
}
