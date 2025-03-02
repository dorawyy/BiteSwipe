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
import androidx.activity.result.contract.ActivityResultContracts
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

    private val locationPermissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestPermission()
    ) { isGranted: Boolean ->
        if (isGranted) {
            requestDeviceLocation()
        } else {
            if (!shouldShowRequestPermissionRationale(Manifest.permission.ACCESS_FINE_LOCATION)) {
                // If the user has denied it twice, show settings dialog
                showSettingsDialog()
            } else {
                showLocationDeniedDialog()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_create_group_page)

        ViewCompat.setOnApplyWindowInsetsListener(findViewById(R.id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager
        requestLocationPermission()

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

        val createGroupButton = findViewById<Button>(R.id.create_group_button)
        createGroupButton.setOnClickListener {

//            TODO: API call to Create Group
//            TODO: Send Group Creator to Backend
//            TODO: Open ModerateGroupPage Activity
            val selectedCuisineNames = selectedCuisines.joinToString { it.name }
            val searchRadius = findViewById<EditText>(R.id.searchRadiusText).text.toString()
            Log.d(TAG, "Selected cuisines: $selectedCuisineNames \n Search Radius: $searchRadius")

            if (userLocation == null) {
                showLocationDeniedDialog()
            } else {
                val intent = Intent(this, ModerateGroupPage::class.java)
                startActivity(intent)
            }
        }

        val backButton: ImageButton = findViewById(R.id.create_back_button)
        backButton.setOnClickListener {
            finish()
        }
    }

    private fun requestLocationPermission() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            locationPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
        } else {
            requestDeviceLocation()
        }
    }

    private fun requestDeviceLocation() {
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            val provider = when {
                locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER) -> LocationManager.GPS_PROVIDER
                locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER) -> LocationManager.NETWORK_PROVIDER
                else -> {
                    Log.e(TAG, "No location provider enabled")
                    showLocationDeniedDialog()
                    return
                }
            }

            locationManager.requestLocationUpdates(provider, 0, 0f, this)
        }
    }

    override fun onLocationChanged(location: Location) {
        userLocation = location
        Log.d(TAG, "User location: ${location.latitude}, ${location.longitude}")
        locationManager.removeUpdates(this) // Stop further updates after getting the first location
    }

    private fun showLocationDeniedDialog() {
        AlertDialog.Builder(this)
            .setTitle("Location Required")
            .setMessage("To create a group, you must share your current location.")
            .setCancelable(false)
            .setPositiveButton("Retry") { _, _ -> requestLocationPermission() }
            .setNegativeButton("Back") { _, _ -> finish() }
            .show()
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
        locationManager.removeUpdates(this) // Ensure updates stop when activity is destroyed
    }
}
