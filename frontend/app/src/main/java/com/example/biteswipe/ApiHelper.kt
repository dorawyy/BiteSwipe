package com.example.biteswipe

import android.content.Context
import android.util.Log
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.biteswipe.cards.RestaurantCard
import com.example.biteswipe.jsonFormats.Creator
import com.example.biteswipe.jsonFormats.Location
import com.example.biteswipe.jsonFormats.Participant
import com.example.biteswipe.jsonFormats.Preference
import com.example.biteswipe.jsonFormats.Restaurant
import com.example.biteswipe.jsonFormats.RestaurantData
import com.example.biteswipe.jsonFormats.Settings
import com.example.biteswipe.jsonFormats.sessionDetails
import com.example.biteswipe.jsonFormats.UserId

import okhttp3.*
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.io.IOException

interface ApiHelper {
    val client: OkHttpClient
        get() = OkHttpClient()

    /**
     * Retrieves the base API URL dynamically from `strings.xml`
     */
    fun getBaseUrl(context: Context): String {
        return context.getString(R.string.base_url)
    }

    /**
     * Default error handler: Shows a toast and logs the error.
     */
    fun defaultOnError(context: Context, code: Int?, message: String?) {
        (context as? AppCompatActivity)?.runOnUiThread {
            Toast.makeText(context, "API Error", Toast.LENGTH_SHORT).show()
        }
        Log.e("API_ERROR", "Error Code: $code, Message: $message")
    }

    /**
     * Makes a general API request with support for all HTTP methods, headers, and JSON body.
     */
    fun apiRequest(
        context: Context,
        endpoint: String,
        method: String = "GET",
        jsonBody: JSONObject? = null,
        headers: Map<String, String> = emptyMap(),
        isFullUrl: Boolean = false,
        onSuccess: (JSONObject) -> Unit,
        onError: ((Int?, String?) -> Unit)? = null,
    ) {

        val url = if (isFullUrl) endpoint else getBaseUrl(context) + endpoint

        val requestBody = jsonBody?.let {
            it.toString().toRequestBody("application/json; charset=utf-8".toMediaType())
        }

        val requestBuilder = Request.Builder().url(url)

        // Apply headers if provided
        headers.forEach { (key, value) ->
            requestBuilder.addHeader(key, value)
        }

        // Apply method-specific handling
        when (method.uppercase()) {
            "POST" -> requestBuilder.post(requestBody ?: "".toRequestBody(null))
            "PUT" -> requestBuilder.put(requestBody ?: "".toRequestBody(null))
            "DELETE" -> requestBuilder.delete(requestBody)
            "PATCH" -> requestBuilder.patch(requestBody ?: "".toRequestBody(null))
        }

        val request = requestBuilder.build()

        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                (context as? AppCompatActivity)?.runOnUiThread {
                    onError?.invoke(null, "Network error: ${e.message}")
                        ?: defaultOnError(context, null, "Network error: ${e.message}")
                }
                Log.e("NETWORK_ERROR", e.toString())
            }

            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string()
                try {
                    if (response.isSuccessful && responseBody != null) {
                        val jsonResponse = JSONObject(responseBody)
                        (context as? AppCompatActivity)?.runOnUiThread {
                            onSuccess(jsonResponse)
                        }
                    } else {
                        (context as? AppCompatActivity)?.runOnUiThread {
                            onError?.invoke(response.code, responseBody)
                                ?: defaultOnError(context, response.code, responseBody)
                        }
                        Log.e("API_ERROR", "Response Code: ${response.code}, Response: $responseBody")
                    }
                } catch (e: Exception) {
                    (context as? AppCompatActivity)?.runOnUiThread {
                        onError?.invoke(response.code, "Parsing error")
                            ?: defaultOnError(context, response.code, "Parsing error")
                    }
                    Log.e("API_ERROR", e.toString())
                }
            }
        })
    }

    fun parseSessionData(json: JSONObject): sessionDetails {
        Log.d("JoinGroupPage", "Parsing session data: $json")

        // Parse the creator, which is just a string ID (not a full object)
        val creatorId = json.getString("creator")
        val creator = Creator(
            _id = creatorId,          // Assuming the creator's ID is the string itself
            displayName = creatorId   // You can replace this with the actual display name if it's available elsewhere
        )

        // Parse the settings and location objects
        val settingsJson = json.getJSONObject("settings")
        val locationJson = settingsJson.getJSONObject("location")
        val location = Location(
            latitude = locationJson.getDouble("latitude"),
            longitude = locationJson.getDouble("longitude"),
            radius = locationJson.getDouble("radius")
        )

        // Parse the participants list
        val participantsJson = json.getJSONArray("participants")
        val participants = mutableListOf<Participant>()
        for (i in 0 until participantsJson.length()) {
            val participantJson = participantsJson.getJSONObject(i)
            val userIdJson = participantJson.getString("userId")  // It's just a string ID here
            val preferencesJson = participantJson.getJSONArray("preferences")
            val preferences = mutableListOf<Preference>()
            for (j in 0 until preferencesJson.length()) {
                val prefJson = preferencesJson.getJSONObject(j)
                preferences.add(Preference(
                    restaurantId = prefJson.getString("restaurantId"),
                    liked = prefJson.getBoolean("liked"),
                    timestamp = prefJson.getString("timestamp")
                ))
            }
            // Add the participant to the list
            participants.add(Participant(UserId(userIdJson, userIdJson), preferences))  // Assuming no display name here
        }

        // Parse the restaurants list
        val restaurantsJson = json.getJSONArray("restaurants")
        val restaurants = mutableListOf<Restaurant>()
        for (i in 0 until restaurantsJson.length()) {
            val restaurantJson = restaurantsJson.getJSONObject(i)
            restaurants.add(Restaurant(
                restaurantId = restaurantJson.getString("restaurantId"),
                score = restaurantJson.getInt("score"),
                totalVotes = restaurantJson.getInt("totalVotes"),
                positiveVotes = restaurantJson.getInt("positiveVotes")
            ))
        }

        // Create the sessionDetails object
        return sessionDetails(
            _id = json.getString("_id"),
            creator = creator,        // Pass the creator object (ID and name)
            settings = Settings(location),
            participants = participants,
            restaurants = restaurants,
            status = json.getString("status"),
            createdAt = json.getString("createdAt"),
            expiresAt = json.getString("expiresAt")
        )
    }

    fun parseRestaurants(jsonString: String): MutableList<RestaurantData> {
        val restaurantList = mutableListOf<RestaurantData>()

        val jsonObject = JSONObject(jsonString)
        val restaurantsArray = jsonObject.optJSONArray("restaurants") ?: return restaurantList

        for (i in 0 until restaurantsArray.length()) {
            val restaurantJson = restaurantsArray.getJSONObject(i)

            val name = restaurantJson.optString("name", "Unknown")
            val address = restaurantJson.optJSONObject("location")?.optString("address", "Unknown") ?: "Unknown"
            val contactNumber = restaurantJson.optJSONObject("contact")?.optString("phone", "No Contact") ?: "No Contact"
            val price = restaurantJson.optInt("priceLevel", 0) // Defaulting to 0 if missing
            val rating = restaurantJson.opt("rating")?.let { (it as Number).toFloat() } ?: 0.0f // Ensure Float type

            // Get the first image from the gallery if available
            val imageGallery = restaurantJson.optJSONObject("images")?.optJSONArray("gallery")
            val picture = if (imageGallery != null && imageGallery.length() > 0) {
                imageGallery.optString(0)
            } else {
                "0"
            }

            restaurantList.add(RestaurantData(name, address, contactNumber, price, rating, picture))
        }

        return restaurantList
    }

}
