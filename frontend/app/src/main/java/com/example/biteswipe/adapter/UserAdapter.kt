package com.example.biteswipe.adapter

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.R
import com.example.biteswipe.cards.UserCard

class UserAdapter(private val context: Context, private val users: MutableList<UserCard>, private val onKickUser: (UserCard) -> Unit) :
    RecyclerView.Adapter<UserAdapter.UserViewHolder>() {

    // ViewHolder class to hold each item view
    class UserViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val userName: TextView = itemView.findViewById(R.id.nk_user_name_box)
        val profilePicture: ImageView = itemView.findViewById(R.id.nk_profile_picture_list_view)
        val kickButton:ImageButton = itemView.findViewById(R.id.kick_user_button)
    }

    // Create a new view holder and inflate the card layout
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UserViewHolder {
        val view = LayoutInflater.from(context).inflate(R.layout.user_card, parent, false)
        return UserViewHolder(view)
    }

    // Bind the data (UserCard) to the views in each item
    override fun onBindViewHolder(holder: UserViewHolder, position: Int) {
        val user = users[position]
        holder.userName.text = user.userName
        holder.profilePicture.setImageResource(user.imageRes)

        // Handle click for the kick button (you can add a listener here)
        holder.kickButton.setOnClickListener {

            onKickUser(user)
        }
    }

    // Return the size of the list
    override fun getItemCount(): Int = users.size
}
