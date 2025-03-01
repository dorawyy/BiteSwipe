package com.example.biteswipe.adapter

import android.content.Context
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.CheckBox
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.R
import com.example.biteswipe.cards.CuisineCard

class CuisineAdapter(
    private val context: Context,
    private val cuisines: MutableList<CuisineCard>,
    private val onCuisineSelected: (CuisineCard) -> Unit
) : RecyclerView.Adapter<CuisineAdapter.CuisineViewHolder>() {

    inner class CuisineViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val cuisineName: TextView = itemView.findViewById(R.id.cuisine_name)
        val cuisineCheckBox: CheckBox = itemView.findViewById(R.id.cuisine_checkbox)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CuisineViewHolder {
        val view = LayoutInflater.from(context).inflate(R.layout.cuisine_card, parent, false)
        return CuisineViewHolder(view)
    }

    override fun onBindViewHolder(holder: CuisineViewHolder, position: Int) {
        val cuisine = cuisines[position]
        holder.cuisineName.text = cuisine.name
        holder.cuisineCheckBox.isChecked = cuisine.isSelected

        // Handle CheckBox changes
        holder.cuisineCheckBox.setOnCheckedChangeListener { _, isChecked ->
            Log.d("CuisineAdapter", "Checkbox state changed for ${cuisine.name}: $isChecked")
            cuisine.isSelected = isChecked
            onCuisineSelected(cuisine) // notify the activity/fragment about the selection
        }
    }

    override fun getItemCount(): Int = cuisines.size
}
