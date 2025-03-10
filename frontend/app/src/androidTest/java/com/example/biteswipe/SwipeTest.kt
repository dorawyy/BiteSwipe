package com.example.biteswipe

import androidx.recyclerview.widget.RecyclerView
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
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith


@RunWith(AndroidJUnit4::class)
class SwipeTest {
    @get:Rule
    val activityRule = ActivityScenarioRule(MatchingPage::class.java)

    @Test
    fun workingUI () {
//        recycler view exists
        onView(withId(R.id.recycler_view)).check(matches(isDisplayed()))
//      finish text invisible
        onView(withId(R.id.waiting_for_finish_text)).check(matches(withEffectiveVisibility(ViewMatchers.Visibility.INVISIBLE)))
//        is there a card to display
        onView(withId(R.id.recycler_view)).check(matches(hasMinimumChildCount(1)))
    }

    @Test
    fun swipeLeftTest() {
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
    }

    @Test
    fun swipeRightTest() {
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
    }

    @Test
    fun finishSwipingTest() {
        var numCards = 0
        onView(withId(R.id.recycler_view)).check { view, _ ->
            val recyclerView = view as RecyclerView
            numCards = recyclerView.adapter!!.itemCount
        }

        for(i in 0 until numCards) {
            onView(withId(R.id.recycler_view)).perform(RecyclerViewActions.actionOnItemAtPosition<SwipeAdapter.SwipeViewHolder>(0, swipeRight()))
            Thread.sleep(500)
        }

        onView(withId(R.id.recycler_view)).check(matches(withEffectiveVisibility(ViewMatchers.Visibility.INVISIBLE)))
        onView(withId(R.id.waiting_for_finish_text)).check(matches(isDisplayed()))
    }




}