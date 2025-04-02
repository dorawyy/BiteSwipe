package com.example.biteswipe

import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.View
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import androidx.test.core.app.ActivityScenario
import androidx.test.core.app.ApplicationProvider
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.UiController
import androidx.test.espresso.ViewAction
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.closeSoftKeyboard
import androidx.test.espresso.action.ViewActions.typeText
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.contrib.RecyclerViewActions
import androidx.test.espresso.intent.matcher.IntentMatchers.hasComponent
import androidx.test.espresso.matcher.ViewMatchers.hasDescendant
import androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.espresso.matcher.ViewMatchers.withText
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.UiSelector
import com.example.biteswipe.adapter.CuisineAdapter
import com.example.biteswipe.pages.CreateGroupPage
import com.example.biteswipe.pages.ModerateGroupPage
import org.junit.After

import org.junit.Test
import org.junit.runner.RunWith

import org.junit.Before
import org.junit.FixMethodOrder
import org.junit.runners.MethodSorters

/**
 * Instrumented test, which will execute on an Android device.
 *
 * See [testing documentation](http://d.android.com/tools/testing).
 */
@RunWith(AndroidJUnit4::class)
@FixMethodOrder(MethodSorters.NAME_ASCENDING)
class BCreateGroupTest {

    lateinit var scenario: ActivityScenario<CreateGroupPage>

    @Before
    fun setup() {
        Intents.init()
    }

    @After
    fun tearDown() {
        Intents.release()
    }
//    for starting page with correct intent
    private fun startPage() {

        val context = ApplicationProvider.getApplicationContext<Context>()
        val sharedPreferences = context.getSharedPreferences("TestPrefs", Context.MODE_PRIVATE)
        val userId = sharedPreferences.getString("userId", null)
        val intent = Intent(context, CreateGroupPage::class.java).apply {
                putExtra("userId", userId)
                putExtra("userEmail", "biteswiped@gmail.com")
            }
        Log.d("BCreateGroupTest", "userId: $userId")
        scenario = ActivityScenario.launch(intent)
        Thread.sleep(5000)
        val device = androidx.test.uiautomator.UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        val locationAllow = device.findObject(UiSelector().text("While using the app"))
        if (locationAllow.exists() && locationAllow.isEnabled) {
            locationAllow.click()
        }
        Thread.sleep(4000)

    }
//      for testing the recyclerView, generated with assistance from ChatGPT
    private fun clickChildViewWithId(viewId: Int): ViewAction {
    return object : ViewAction {
        override fun getConstraints(): org.hamcrest.Matcher<View> {
            return isAssignableFrom(View::class.java)
        }

        override fun getDescription(): String {
            return "Click on a child view with id $viewId"
        }

        override fun perform(uiController: UiController?, view: View?) {
            val childView = view?.findViewById<View>(viewId)
            childView?.performClick()
        }
    }
}

    private fun setupGroup() {
        onView(withId(R.id.share_group_button)).perform(click())
        onView(withId(R.id.new_member_text)).perform(typeText("byteswiper@gmail.com"), closeSoftKeyboard())
        Thread.sleep(1000)
        onView(withId(R.id.add_member_button)).perform(click())
        Thread.sleep(5000)
    }
    @Test
    fun testA_WorkingUI () {

        startPage()

        // Title
        onView(withId(R.id.textView2)).check(matches(isDisplayed()))
//      Create Group requirements
        onView(withId(R.id.create_group_button)).check(matches(isDisplayed()))
        onView(withId(R.id.searchRadiusText)).check(matches(isDisplayed()))
        onView(withText("Italian")).check(matches(isDisplayed()))
        onView(withId(R.id.create_back_button)).check(matches(isDisplayed()))
        scenario.close()
    }

    @Test
    fun testC_CreateButton() {
        startPage()

//        test scroll

        onView(withText("Italian"))
            .perform(click())
//      test click on an item


        onView(withId(R.id.searchRadiusText)).perform(typeText("10"), closeSoftKeyboard())

        Thread.sleep(5000)
        onView(withId(R.id.create_group_button)).perform(click())


        Thread.sleep(8000)
//        check if we shifted views or not
        Intents.intended(hasComponent(ModerateGroupPage::class.java.name))

//        store join code, sessionId for future use
        onView(withId(R.id.placeholderText))
            .perform(object : ViewAction {
                override fun getConstraints(): org.hamcrest.Matcher<View> {
                    return isAssignableFrom(TextView::class.java)
                }

                override fun getDescription(): String {
                    return "Get text from TextView"
                }

                override fun perform(uiController: UiController?, view: View?) {
                    val textView = view as TextView
                    val joinCode = textView.text.toString()

//                    store the value in Shared Preferences
                    val context = ApplicationProvider.getApplicationContext<Context>()
                    val sharedPreferences = context.getSharedPreferences("TestPrefs", Context.MODE_PRIVATE)
                    sharedPreferences.edit().putString("joinCode", joinCode).apply()
                }
            })

        onView(withId(R.id.test_session_id))
            .perform(object : ViewAction {
                override fun getConstraints(): org.hamcrest.Matcher<View> {
                    return isAssignableFrom(TextView::class.java)
                }

                override fun getDescription(): String {
                    return "Get text from TextView"
                }

                override fun perform(uiController: UiController?, view: View?) {
                    val textView = view as TextView
                    val sessionId = textView.text.toString()

//                    store the value in Shared Preferences
                    val context = ApplicationProvider.getApplicationContext<Context>()
                    val sharedPreferences = context.getSharedPreferences("TestPrefs", Context.MODE_PRIVATE)
                    sharedPreferences.edit().putString("sessionId", sessionId).apply()
                }
            })

        setupGroup()
        scenario.close()
    }


    @Test
    fun testB_InvalidParameters() {
        startPage()
//        check for invalid cuisine preferences
        onView(withId(R.id.searchRadiusText)).perform(typeText("0"), closeSoftKeyboard())
        onView(withId(R.id.create_group_button)).perform(click())

        Thread.sleep(3000)
//        check if we shifted pages
        Intents.intended(hasComponent(CreateGroupPage::class.java.name))

//        check for invalid radius
        onView(withText("Italian"))
            .perform(click())

        onView(withId(R.id.create_group_button)).perform(click())
        Thread.sleep(3000)
        Intents.intended(hasComponent(CreateGroupPage::class.java.name))
        scenario.close()
    }
}