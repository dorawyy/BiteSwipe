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
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.adapter.CuisineAdapter
import com.example.biteswipe.cards.CuisineCard
import org.json.JSONObject

class CreateGroupPage : AppCompatActivity(), LocationListener, ApiHelper {
    private val TAG = "CreateGroupPage"
    private lateinit var recyclerView: RecyclerView
    private lateinit var cuisineAdapter: CuisineAdapter
    private lateinit var locationManager: LocationManager
    private var userLocation: Location? = null
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
    private val selectedCuisines = mutableListOf<CuisineCard>()

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
        locationManager = getSystemService(Context.LOCATION_SERVICE) as LocationManager

//        Set up Cuisines
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

//        check permissions
        if (ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            Log.d(TAG, "Location permissions already granted")
            startLocationUpdates()
        } else {
            Log.d(TAG, "Requesting location permissions")
            showSettingsDialog()
        }


        val createGroupButton = findViewById<Button>(R.id.create_group_button)
        createGroupButton.setOnClickListener {
//
//            TODO: Handle Cuisines Later
            val searchRadius = findViewById<EditText>(R.id.searchRadiusText).text.toString()

            val endpoint = "/sessions/"
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
            finish()
        }
    }

    private fun startLocationUpdates() {
        if (ActivityCompat.checkSelfPermission(
                this,
                Manifest.permission.ACCESS_FINE_LOCATION
            ) == PackageManager.PERMISSION_GRANTED
        ) {
            locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 10000, 0f, this)
        } else {
            Toast.makeText(this, "Location permission is required.", Toast.LENGTH_SHORT).show()
            showSettingsDialog()
        }
    }

    override fun onLocationChanged(location: Location) {
        userLocation = location
        latitude = location.latitude
        longitude = location.longitude
        Log.d(TAG, "Location Changed: Latitude: $latitude, Longitude: $longitude")
    }

    private fun showSettingsDialog() {
        Log.d(TAG, "Location Result: ${ActivityCompat.checkSelfPermission(this, android.Manifest.permission.ACCESS_FINE_LOCATION)}")
        AlertDialog.Builder(this)
            .setTitle("Enable Location Permission")
            .setMessage("To create a group, please enable location permissions in settings.")
            .setCancelable(false)
            .setPositiveButton("Go to Settings") { _, _ ->
                Log.d(TAG, "Going to settings")
                val intent = Intent(
                    Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                    Uri.fromParts("package", packageName, null)
                )
                startActivity(intent)
            }
            .setNegativeButton("Back") { _, _ -> finish() }
            .show()
    }
    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)

        if (requestCode == 100) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                // Permission granted, start location updates
                startLocationUpdates()
            } else {
                // Permission denied, show a message or ask user to enable it
                Toast.makeText(this, "Location permission is required to create a group.", Toast.LENGTH_SHORT).show()
                showSettingsDialog()
            }
        }
    }
    override fun onDestroy() {
        super.onDestroy()
        // Stop location updates when the activity is destroyed to avoid unnecessary resource usage
        if (ActivityCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            locationManager.removeUpdates(this)
        }
    }
}
