package com.example.biteswipe.adapter

import com.example.biteswipe.cards.RestaurantCard
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.RatingBar
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.R
import kotlinx.coroutines.*
import java.net.HttpURLConnection
import java.net.URL

class SwipeAdapter(private val context: Context, private val cards: List<RestaurantCard>) : RecyclerView.Adapter<SwipeAdapter.SwipeViewHolder>() {

    // ViewHolder that binds the views in the layout file
    class SwipeViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val cardImage: ImageView = itemView.findViewById(R.id.restaurant_image)
        val cardName: TextView = itemView.findViewById(R.id.restaurant_name)
        val cardAddress: TextView = itemView.findViewById(R.id.restaurant_address)
        val cardContact: TextView = itemView.findViewById(R.id.restaurant_contact)
        val cardPrice: TextView = itemView.findViewById(R.id.restaurant_price)
        val cardRating: RatingBar = itemView.findViewById(R.id.restaurant_rating)
    }

    // Called when the RecyclerView needs a new ViewHolder
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): SwipeViewHolder {
        // Inflate the card_item layout and return the ViewHolder
        val view = LayoutInflater.from(context).inflate(R.layout.restaurant_card, parent, false)
        return SwipeViewHolder(view)
    }

    // Called to bind the data to the views in each item (each card)
    override fun onBindViewHolder(holder: SwipeViewHolder, position: Int) {
        val card = cards[position]
        holder.cardName.text = card.restaurantName
        holder.cardAddress.text = card.address
        holder.cardContact.text = card.contact
        holder.cardPrice.text = when (card.price) {
            1 -> "$"
            2 -> "$$"
            3 -> "$$$"
            else -> ""
        }
        holder.cardRating.rating = card.rating

//        handle image
        GlobalScope.launch(Dispatchers.Main) {
            val bmp = downloadImage(card.imageRes, holder.cardImage)
            holder.cardImage.setImageBitmap(bmp)
        }
    }

    private fun downloadImage(imageRes: String, imageView: ImageView): Bitmap? {
        if (imageRes == "") {
            Log.d("SwipeAdapter", "No image found")
            return getDefaultBitmap()
        }
        var bitmap: Bitmap? = null
        CoroutineScope(Dispatchers.IO).launch {
            try {
                bitmap = withContext(Dispatchers.IO) {
                    try {
                        val urlConnection = URL(imageRes).openConnection() as HttpURLConnection
                        urlConnection.apply {
                            requestMethod = "GET"
                            connectTimeout = 15000
                            readTimeout = 15000
                        }
                        val inputStream = urlConnection.inputStream
                        BitmapFactory.decodeStream(inputStream)
                    } catch (e: Exception) {
                        // Log and return a default image if there's an error
                        Log.e("ImageDownload", "Error downloading image", e)
                        getDefaultBitmap()
                    }
                }

            } catch (e: Exception) {
                Log.e("ImageDownload", "Error setting image", e)
                bitmap = getDefaultBitmap()
            }
        }
        return bitmap

    }
    private fun getDefaultBitmap(): Bitmap {
        // Create a 100x100 bitmap
        val bitmap = Bitmap.createBitmap(100, 100, Bitmap.Config.ARGB_8888)

        // Set up a canvas to draw on the bitmap
        val canvas = Canvas(bitmap)

        // Set the paint color to Android green (#A4C639)
        val paint = Paint().apply {
            color = Color.parseColor("#A4C639") // Android Green color
            style = Paint.Style.FILL
        }

        // Fill the canvas with the green color
        canvas.drawRect(0f, 0f, bitmap.width.toFloat(), bitmap.height.toFloat(), paint)

        return bitmap
    }

    // Return the total number of items in the dataset
    override fun getItemCount(): Int {
        return cards.size
    }
}
