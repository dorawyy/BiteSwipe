package com.example.biteswipe.adapter

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.R
import com.example.biteswipe.UserCard

class UserAdapter(private val context: Context, private val users: List<UserCard>) : RecyclerView.Adapter<UserAdapter.UserViewHolder>() {

    class UserViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val profilePicture: ImageView = itemView.findViewById(R.id.profile_picture_list_view)
        val userName: TextView = itemView.findViewById(R.id.user_name_box)
    }

    override fun onCreateViewHolder(parent:ViewGroup, viewType: Int): UserViewHolder {
        val view = LayoutInflater.from(context).inflate(R.layout.user_card, parent, false)
        return UserViewHolder(view)
    }

    override fun onBindViewHolder(holder: UserViewHolder, position: Int) {
        val user = users[position]
        holder.userName.text = user.userName
        holder.profilePicture.setImageResource(user.imageRes)
    }

    override fun getItemCount(): Int {
        return users.size
    }
}