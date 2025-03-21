package com.example.biteswipe

import android.content.Context
import android.util.Log
import android.view.View
import android.widget.TextView
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.uiautomator.UiDevice
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.uiautomator.UiSelector
import org.junit.Test
import org.junit.runner.RunWith
import androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom
import org.hamcrest.Matcher
import org.junit.FixMethodOrder
import org.junit.runners.MethodSorters

@RunWith(AndroidJUnit4::class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
class ALoginPageTest {

//    @get:Rule
//    val activityScenarioRule = ActivityScenarioRule(LoginPage::class.java)

    @Test
    fun testA_Login() {

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
        Thread.sleep(8000)

        // Verify an element in HomePage is displayed
        onView(withId(R.id.main_join_group_button))
            .check(matches(isDisplayed()))

//        Save login ID for future tests
        onView(withId(R.id.test_user_id))
            .perform(object : ViewAction {
                override fun getConstraints(): Matcher<View> {
                    return isAssignableFrom(TextView::class.java)
                }

                override fun getDescription(): String {
                    return "Get text from TextView"
                }

                override fun perform(uiController: UiController?, view: View?) {
                    val textView = view as TextView
                    val userId = textView.text.toString()

//                    store the value in Shared Preferences
                    val context = ApplicationProvider.getApplicationContext<Context>()
                    val sharedPreferences = context.getSharedPreferences("TestPrefs", Context.MODE_PRIVATE)
                    sharedPreferences.edit().putString("userId", userId).apply()
                    Log.d("ALoginPageTest", "userId saved: $userId")
                }
            })

        scenario.close()
    }
}
