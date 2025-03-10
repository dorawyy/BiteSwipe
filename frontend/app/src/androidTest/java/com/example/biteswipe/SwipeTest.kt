package com.example.biteswipe

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith


@RunWith(AndroidJUnit4::class)
class SwipeTest {
    @get:Rule
    val activityRule = ActivityScenarioRule(MatchingPage::class.java)

    @Test
    fun workingUI () {
        // Title
        onView(withId(R.id.titleText)).check(matches(isDisplayed()))
//      Join Group requirements
        onView(withId(R.id.groupIdInputLayout)).check(matches(isDisplayed()))
        onView(withId(R.id.join_button)).check(matches(isDisplayed()))
        onView(withId(R.id.join_back_button)).check(matches(isDisplayed()))

//        Display user email id (provided by backend)
        onView(withId(R.id.textView13)).check(matches(isDisplayed()))
    }
    

}