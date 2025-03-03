package com.example.biteswipe.jsonFormats

data class sessionDetails(
    val _id: String,
    val creator: Creator,
    val settings: Settings,
    val participants: List<Participant>,
    val restaurants: List<Restaurant>,
    val status: String,
    val createdAt: String,
    val expiresAt: String
)

data class Creator(
    val _id: String,
    val displayName: String
)

data class Settings(
    val location: Location
)

data class Location(
    val latitude: Double,
    val longitude: Double,
    val radius: Double
)

data class Participant(
    val userId: UserId,
    val preferences: List<Preference>
)

data class UserId(
    val _id: String,
    val displayName: String
)

data class Preference(
    val restaurantId: String,
    val liked: Boolean,
    val timestamp: String // Assuming timestamp is in ISO 8601 format or any string format. You can change it to `Date` if needed
)

data class Restaurant(
    val restaurantId: String,
    val score: Int,
    val totalVotes: Int,
    val positiveVotes: Int
)

data class RestaurantData(
    val name: String,
    val address: String,
    val contactNumber: String,
    val price: Int,
    val rating: Float,
    val picture: String
)
