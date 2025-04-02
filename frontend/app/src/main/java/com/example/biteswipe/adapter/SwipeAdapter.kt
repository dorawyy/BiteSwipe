package com.example.biteswipe.adapter

import com.example.biteswipe.cards.RestaurantCard
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.drawable.BitmapDrawable
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.RatingBar
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import coil.load
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

//            load error image
            val defaultDrawable = BitmapDrawable(context.resources, getDefaultBitmap())

            holder.cardImage.load(card.imageRes){
//                  placeholder(defaultDrawable)
//                TODO: add placeholder (loading) images
                error(defaultDrawable)
            }
        }
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
