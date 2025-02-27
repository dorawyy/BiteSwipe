import android.os.Bundle
import android.view.View
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import android.view.MotionEvent
import android.view.GestureDetector
import androidx.recyclerview.widget.ItemTouchHelper
import android.widget.RelativeLayout
import androidx.cardview.widget.CardView
import android.view.LayoutInflater
import android.view.ViewGroup
import android.content.Context
import androidx.recyclerview.widget.RecyclerView.Adapter
import com.example.biteswipe.R
import com.example.biteswipe.SwipeAdapter

class SwipeActivity : AppCompatActivity() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: SwipeAdapter
    private lateinit var cards: MutableList<RestaurantCard>
    private var currentCardIndex = 0

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_matching_page)

        // Sample cards
        cards = mutableListOf(
            RestaurantCard("John Doe", R.drawable.ic_settings),
            RestaurantCard("Jane Doe", R.drawable.ic_settings),
            RestaurantCard("Mike Tyson", R.drawable.ic_launcher_background)
        )

        recyclerView = findViewById(R.id.recycler_view)
        recyclerView.layoutManager = LinearLayoutManager(this, LinearLayoutManager.HORIZONTAL, false)
        adapter = SwipeAdapter(this, cards)
        recyclerView.adapter = adapter

        setupSwipeListener()
    }

    private fun setupSwipeListener() {
        val gestureDetector = GestureDetector(this, object : GestureDetector.SimpleOnGestureListener() {
            override fun onDown(e: MotionEvent?): Boolean {
                return true
            }

            override fun onScroll(e1: MotionEvent?, e2: MotionEvent?, distanceX: Float, distanceY: Float): Boolean {
                // Detect left or right swipe
                val deltaX = e2?.x?.minus(e1?.x ?: 0f) ?: 0f
                if (Math.abs(deltaX) > 100) {
                    if (deltaX > 0) {
                        // Swiped Right
                        swipeCardRight()
                    } else {
                        // Swiped Left
                        swipeCardLeft()
                    }
                    return true
                }
                return super.onScroll(e1, e2!!, distanceX, distanceY)
            }
        })

        recyclerView.setOnTouchListener { v, event ->
            gestureDetector.onTouchEvent(event)
            true
        }
    }

    private fun swipeCardRight() {
        // Handle swiping right (like action)
        if (currentCardIndex < cards.size) {
            // For now, just remove the first card
            cards.removeAt(currentCardIndex)
            adapter.notifyItemRemoved(currentCardIndex)
        }
    }

    private fun swipeCardLeft() {
        // Handle swiping left (dislike action)
        if (currentCardIndex < cards.size) {
            // For now, just remove the first card
            cards.removeAt(currentCardIndex)
            adapter.notifyItemRemoved(currentCardIndex)
        }
    }
}
