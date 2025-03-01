package com.example.biteswipe.adapter

import android.content.Context
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.FriendsPage
import com.example.biteswipe.R
import com.example.biteswipe.cards.UserCard

class UserAdapterFriends(private val context: Context, private val users: MutableList<UserCard>, private val friendRequestActions: FriendsPage.FriendRequestActions) :
    RecyclerView.Adapter<UserAdapterFriends.UserViewHolder>() {

    class UserViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val userName: TextView = itemView.findViewById(R.id.req_user_name_box)
        val profilePicture: ImageView = itemView.findViewById(R.id.req_profile_picture)
        val acceptButton: ImageButton = itemView.findViewById(R.id.accept_friend_button)
        val rejectButton: ImageButton = itemView.findViewById(R.id.reject_friend_button)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UserViewHolder {
        val view = LayoutInflater.from(context).inflate(R.layout.user_card, parent, false)
        return UserViewHolder(view)
    }

    override fun onBindViewHolder(holder: UserViewHolder, position: Int) {
        val user = users[position]
        holder.userName.text = user.userName
        holder.profilePicture.setImageResource(user.imageRes)

        // Handle click for the kick button (you can add a listener here)
        holder.acceptButton.setOnClickListener {

            friendRequestActions.handleAcceptFriend(user)
        }

        holder.rejectButton.setOnClickListener {
            friendRequestActions.handleRejectFriend(user)
        }
    }

    override fun getItemCount(): Int = users.size

}