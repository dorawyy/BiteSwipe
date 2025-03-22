package com.example.biteswipe

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.uiautomator.UiDevice
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiSelector
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.FixMethodOrder
import org.junit.runners.MethodSorters

@RunWith(AndroidJUnit4::class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
class EUsabilityNFRTest {

//    @get:Rule
//    val activityScenarioRule = ActivityScenarioRule(LoginPage::class.java)

    @Test
    fun testA_Navigation() {

        val scenario = ActivityScenario.launch(LoginPage::class.java)

        // Click Sign-In Button
        onView(withId(R.id.sign_in_button)).perform(click())
        Thread.sleep(5000)
        // Wait and Click the First Google Account (Using UI Automator)
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

        // Find and click the first account in the Google Sign-In popup
        val firstAccount = device.findObject(UiSelector().className("android.widget.TextView").index(0))
        if (firstAccount.exists() && firstAccount.isEnabled) {
            firstAccount.click()
        }
        Thread.sleep(18000)

        // Verify an element in HomePage is displayed
        onView(withId(R.id.main_join_group_button))
            .check(matches(isDisplayed()))

//      Navigate to friends page
        onView(withId(R.id.main_friends_button))
            .perform(click())

        Thread.sleep(1000)

        onView(withId(R.id.friends_back_button))
            .perform(click())

//        Navigate to join group page
        Thread.sleep(1000)

        onView(withId(R.id.main_join_group_button))
            .perform(click())

        Thread.sleep(1000)

        onView(withId(R.id.join_back_button))
            .perform(click())

//        Navigate to create group page

        onView(withId(R.id.main_create_group_button))
            .perform(click())

        Thread.sleep(1000)

        val device2 = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        val locationAllow = device2.findObject(UiSelector().text("While using the app"))
        if (locationAllow.exists() && locationAllow.isEnabled) {
            locationAllow.click()
        }

        Thread.sleep(4000)

        onView(withId(R.id.create_back_button))
            .perform(click())

        scenario.close()
    }
}
