package com.example.biteswipe.helpers

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.animation.AnimationUtils
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import com.example.biteswipe.R

interface ToastHelper {

    fun showCustomToast(context: Context, message: String, isSuccess: Boolean) {
        val inflater = LayoutInflater.from(context)
        val layout: View = inflater.inflate(R.layout.custom_toast, null)

        val icon = layout.findViewById<ImageView>(R.id.toast_icon)
        val textView = layout.findViewById<TextView>(R.id.toast_text)

        textView.text = message
        icon.setImageResource(if (isSuccess) R.drawable.info_i_24px else R.drawable.baseline_block_24)

        val toast = Toast(context)
        toast.duration = Toast.LENGTH_SHORT
        toast.view = layout
        toast.setGravity(Gravity.TOP, 0, 150)

        val handler = Handler(Looper.getMainLooper())

        // enter Animation Sequence
        icon.startAnimation(AnimationUtils.loadAnimation(context, R.anim.toast_slide_down))
        handler.postDelayed({
            icon.startAnimation(AnimationUtils.loadAnimation(context, R.anim.toast_hang))
            handler.postDelayed({
                layout.startAnimation(AnimationUtils.loadAnimation(context, R.anim.toast_enter))
            }, 400)
        }, 400)

        toast.show()

        // exit Animation Sequence
        handler.postDelayed({
            layout.startAnimation(AnimationUtils.loadAnimation(context, R.anim.toast_exit))
            handler.postDelayed({
                icon.startAnimation(AnimationUtils.loadAnimation(context, R.anim.toast_hang))
                handler.postDelayed({
                    icon.startAnimation(AnimationUtils.loadAnimation(context, R.anim.toast_slide_up))
                }, 400)
            }, 400)
        }, 3000)
    }
}
