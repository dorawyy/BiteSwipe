package com.example.biteswipe

import android.content.Context
import android.content.Intent
import android.util.Log
import androidx.recyclerview.widget.RecyclerView
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.swipeLeft
import androidx.test.espresso.action.ViewActions.swipeRight
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.contrib.RecyclerViewActions
import androidx.test.espresso.matcher.ViewMatchers
import androidx.test.espresso.matcher.ViewMatchers.hasMinimumChildCount
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withEffectiveVisibility
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.example.biteswipe.adapter.SwipeAdapter
import org.json.JSONObject
import org.junit.Assume
import org.junit.Before
import org.junit.FixMethodOrder
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.runners.MethodSorters
import java.util.concurrent.CountDownLatch


@RunWith(AndroidJUnit4::class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
class DSwipeTest : ApiHelper{

    lateinit var mainScenario: ActivityScenario<MatchingPage>

    private fun startPage() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val sharedPreferences = context.getSharedPreferences("TestPrefs", Context.MODE_PRIVATE)
        val userId = sharedPreferences.getString("userId", null)
        val sessionId = sharedPreferences.getString("sessionId", null)


        val intent = Intent(context, MatchingPage::class.java).apply {
            putExtra("userId", userId)
            putExtra("sessionId", sessionId)
        }

        Log.d("DSwipeTest", "userId: $userId, sessionId: $sessionId")
        mainScenario = ActivityScenario.launch(intent)
    }

    private fun startMatching() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val sharedPreferences = context.getSharedPreferences("TestPrefs", Context.MODE_PRIVATE)
        val userId = sharedPreferences.getString("userId", null)
        val sessionId = sharedPreferences.getString("sessionId", null)
        val body = JSONObject().apply {
            put("userId", userId)
            put("time", 5)
        }
        Log.d("DSwipeTest", "userId: $userId, sessionId: $sessionId")
        apiRequest(
            context = context,
            endpoint = "/sessions/$sessionId/start",
            method = "POST",
            jsonBody = body,
            onSuccess = { response ->
                Log.d("DSwipeTest", "Starting Matching")
            }
        )
    }

    @Test
    fun testA_WorkingUI () {
//        initialize page
        startMatching()
        startPage()
        Thread.sleep(10000)
//        recycler view exists
        onView(withId(R.id.recycler_view)).check(matches(isDisplayed()))
//      finish text invisible
        onView(withId(R.id.waiting_for_finish_text)).check(matches(withEffectiveVisibility(ViewMatchers.Visibility.INVISIBLE)))
//        is there a card to display
        onView(withId(R.id.recycler_view)).check(matches(hasMinimumChildCount(1)))

        mainScenario.close()
    }

    @Test
    fun testB_SwipeLeftTest() {
//        initialize page
        startPage()
        Thread.sleep(10000)
        var numCards = 0
        onView(withId(R.id.recycler_view)).check { view, _ ->
            val recyclerView = view as RecyclerView
            numCards = recyclerView.adapter!!.itemCount
        }

        if(numCards == 0) {
            return
        }

        if(numCards == 1) {
            onView(withId(R.id.recycler_view)).perform(RecyclerViewActions.actionOnItemAtPosition<SwipeAdapter.SwipeViewHolder>(0, swipeLeft()))
            Thread.sleep(1500)
            onView(withId(R.id.recycler_view)).check(matches(withEffectiveVisibility(ViewMatchers.Visibility.INVISIBLE)))
            onView(withId(R.id.waiting_for_finish_text)).check(matches(isDisplayed()))
            return;
        }
//        Test Swipe Left
        onView(withId(R.id.recycler_view)).perform(RecyclerViewActions.actionOnItemAtPosition<SwipeAdapter.SwipeViewHolder>(0, swipeLeft()))

//        check one less restaurant
        onView(withId(R.id.recycler_view)).check(matches(hasMinimumChildCount(numCards - 1)))

        mainScenario.close()
    }

    @Test
    fun testC_SwipeRightTest() {
//        initialize page
        startPage()
        Thread.sleep(10000)

        var numCards = 0
        onView(withId(R.id.recycler_view)).check { view, _ ->
            val recyclerView = view as RecyclerView
            numCards = recyclerView.adapter!!.itemCount
        }
        if (numCards == 0){
            return
        }

        if(numCards == 1) {
            onView(withId(R.id.recycler_view)).perform(RecyclerViewActions.actionOnItemAtPosition<SwipeAdapter.SwipeViewHolder>(0, swipeRight()))
            Thread.sleep(1500)
            onView(withId(R.id.recycler_view)).check(matches(withEffectiveVisibility(ViewMatchers.Visibility.INVISIBLE)))
            onView(withId(R.id.waiting_for_finish_text)).check(matches(isDisplayed()))
            return;
        }
//        Test Swipe Right
        onView(withId(R.id.recycler_view)).perform(RecyclerViewActions.actionOnItemAtPosition<SwipeAdapter.SwipeViewHolder>(0, swipeRight()))

//        check one less restaurant
        onView(withId(R.id.recycler_view)).check(matches(hasMinimumChildCount(numCards - 1)))

        mainScenario.close()
    }

    @Test
    fun testD_FinishSwipingTest() {
//        initialize page
        startPage()
        Thread.sleep(10000)

        var numCards = 0
        onView(withId(R.id.recycler_view)).check { view, _ ->
            val recyclerView = view as RecyclerView
            numCards = recyclerView.adapter!!.itemCount
        }

        for(i in 0 until numCards) {
            onView(withId(R.id.recycler_view)).perform(RecyclerViewActions.actionOnItemAtPosition<SwipeAdapter.SwipeViewHolder>(0, swipeRight()))
            Thread.sleep(2000)
        }
        Thread.sleep(1000)
        onView(withId(R.id.recycler_view)).check(matches(withEffectiveVisibility(ViewMatchers.Visibility.INVISIBLE)))
        onView(withId(R.id.waiting_for_finish_text)).check(matches(isDisplayed()))

        mainScenario.close()
    }




}