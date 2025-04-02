package com.example.biteswipe.pages

import android.content.Intent
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.biteswipe.R
import com.example.biteswipe.helpers.ApiHelper
import com.example.biteswipe.R.*
import com.example.biteswipe.adapter.UserAdapterNoKick
import com.example.biteswipe.helpers.ToastHelper
import com.example.biteswipe.jsonFormats.sessionDetails
import org.json.JSONObject

class JoinGroupPage : AppCompatActivity(), ApiHelper, ToastHelper {
    private lateinit var sessionId: String
    private lateinit var userId: String
    private lateinit var session: sessionDetails
    private lateinit var userEmail: String
    private lateinit var invitedRecyclerView: RecyclerView
    private lateinit var tempHiddenText: TextView
    private lateinit var adapter: UserAdapterNoKick
    private val TAG = "JoinGroupPage"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContentView(layout.activity_join_group_page)
        ViewCompat.setOnApplyWindowInsetsListener(findViewById(id.main)) { v, insets ->
            val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
            v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
            insets
        }

        userId = intent.getStringExtra("userId") ?: ""
        userEmail = intent.getStringExtra("userEmail") ?: ""
        sessionId = intent.getStringExtra("sessionId") ?: ""
        val fromNotification = intent.getBooleanExtra("fromNotification", false)

        if(fromNotification){
            val groupId = intent.getStringExtra("groupId") ?: ""
            val inflater = LayoutInflater.from(this)
            val dialogView: View = inflater.inflate(R.layout.dialog_join_invited_group, null)
            val dialog = AlertDialog.Builder(this)
                .setView(dialogView)
                .setCancelable(true)
                .create()
            val joinText = dialogView.findViewById<TextView>(R.id.confirm_join_text)
            joinText.text = "Join Group ${groupId}?"


            val acceptInvitationButton = dialogView.findViewById<ImageButton>(R.id.accept_invitation_button)
            val rejectInvitationButton = dialogView.findViewById<ImageButton>(R.id.reject_invitation_button)
            acceptInvitationButton.setOnClickListener {
                val endpoint = "/sessions/$groupId/participants"
                val body = JSONObject().apply {
                    put("userId", userId)
                }
                Log.d(TAG, "userId: $userId")
                apiRequest(
                    context = this,
                    endpoint = endpoint,
                    method = "POST",
                    jsonBody = body,
                    onSuccess = { response ->
                        Log.d(TAG, "Response: $response")
                        Log.d(TAG, "Creator: ${response.getString("creator")}")
                        session = parseSessionData(response)
                        sessionId = session._id
                        val intent = Intent(this, ViewGroupPage::class.java)
                        intent.putExtra("sessionId", sessionId)
                        intent.putExtra("userId", userId)
                        startActivity(intent)
                        finish()
                    },
                    onError = { code, message ->
                        showCustomToast(this, "Invalid Group Code", false)
                        Log.d(TAG, "Error joining group: $message")
                    }
                )
                dialog.dismiss()
            }

            rejectInvitationButton.setOnClickListener {
                val endpoint = "/sessions/$sessionId/invitations/$userId"
                val body = JSONObject().apply {
                    put("userId", userId)
                }
                Log.d(TAG, "userId: $userId")
                apiRequest(
                    context = this,
                    endpoint = endpoint,
                    method = "DELETE",
                    jsonBody = body,
                    onSuccess = { response ->
//                        continue execution as normal
                    },
                    onError = { code, message ->
                        showCustomToast(this, "Invalid Group Code", false)
                        Log.d(TAG, "CAUTION: Invitation not rejected, $message")

                    }
                )
                dialog.dismiss()
            }

            invitedRecyclerView = dialogView.findViewById(R.id.invited_recycler_view)
            invitedRecyclerView.visibility = View.GONE
            tempHiddenText = dialogView.findViewById(R.id.invitee_text)
            tempHiddenText.visibility = View.GONE
//              TODO: Show who sent the invitation
//            invitedRecyclerView.layoutManager = LinearLayoutManager(this)
//            adapter = UserAdapterNoKick(this, requests)
//            invitedRecyclerView.adapter = adapter

            dialog.show()
        }


        val userIdText = findViewById<TextView>(id.join_user_id_text)
        userIdText.text = userEmail
        Log.d(TAG, "User ID: $userId")
        val joinButton = findViewById<Button>(id.join_button)
        joinButton.setOnClickListener {
            val sessionToJoin = findViewById<EditText>(id.group_id_input).text.toString()
            val endpoint = "/sessions/$sessionToJoin/participants"
            val body = JSONObject().apply {
                    put("userId", userId)
            }
            Log.d(TAG, "userId: $userId")
            apiRequest(
                context = this,
                endpoint = endpoint,
                method = "POST",
                jsonBody = body,
                onSuccess = { response ->
                    Log.d(TAG, "Response: $response")
                    Log.d(TAG, "Creator: ${response.getString("creator")}")
                    session = parseSessionData(response)
                    sessionId = session._id
                    val intent = Intent(this, ViewGroupPage::class.java)
                    intent.putExtra("sessionId", sessionId)
                    intent.putExtra("userId", userId)
                    startActivity(intent)
                    finish()
                },
                onError = { code, message ->
                    showCustomToast(this, "Invalid Group Code", false)
                    Log.d(TAG, "Error joining group: $message")
                }
            )

        }

        val backButton: ImageButton = findViewById(id.join_back_button)
        backButton.setOnClickListener {
            finish()
        }


    }
}