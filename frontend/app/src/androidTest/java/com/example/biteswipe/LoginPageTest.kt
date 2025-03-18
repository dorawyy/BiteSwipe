package com.example.biteswipe

import androidx.test.core.app.ActivityScenario
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.uiautomator.UiDevice
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiSelector
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.intent.Intents.intended
import androidx.test.espresso.intent.matcher.IntentMatchers.hasComponent

@RunWith(AndroidJUnit4::class)
class LoginPageTest {

//    @get:Rule
//    val activityScenarioRule = ActivityScenarioRule(LoginPage::class.java)

    @Test
    fun clickButton_shouldPass() {

        val scenario = ActivityScenario.launch(LoginPage::class.java)

        // Click Sign-In Button
        onView(withId(R.id.sign_in_button)).perform(click())

        // Wait and Click the First Google Account (Using UI Automator)
        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())

        // Find and click the first account in the Google Sign-In popup
        val firstAccount = device.findObject(UiSelector().className("android.widget.TextView").index(0))
        if (firstAccount.exists() && firstAccount.isEnabled) {
            firstAccount.click()
        }

        // Verify an element in HomePage is displayed
        onView(withId(R.id.main_join_group_button))
            .check(matches(isDisplayed()))

        scenario.close()
    }
}
