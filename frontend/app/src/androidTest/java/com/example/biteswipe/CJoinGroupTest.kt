package com.example.biteswipe

import android.content.Context
import android.content.Intent
import android.util.Log
import android.view.View
import android.widget.TextView
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
import androidx.test.espresso.intent.matcher.IntentMatchers.hasComponent
import androidx.test.espresso.matcher.ViewMatchers.isAssignableFrom
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.uiautomator.UiDevice
import androidx.test.uiautomator.UiSelector
import com.example.biteswipe.pages.JoinGroupPage
import com.example.biteswipe.pages.LoginPage
import com.example.biteswipe.pages.ViewGroupPage
import org.hamcrest.Matcher
import org.hamcrest.Matchers.instanceOf
import org.junit.After

import org.junit.Test
import org.junit.runner.RunWith

import org.junit.Assert.*
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
class CJoinGroupTest {
//    @get:Rule
//    val activityRule = ActivityScenarioRule(JoinGroupPage::class.java)
    lateinit var mainScenario: ActivityScenario<JoinGroupPage>
    @Before
    fun setup() {
        Intents.init()
    }

    @After
    fun tearDown() {
        Intents.release()
    }

    private var userId: String = ""

//    to deal with signin for the other user.
    @Test
    fun testA_SignIn() {
//        Sign in with byteswiper@gmail.com

        val scenario = ActivityScenario.launch(LoginPage::class.java)
        onView(withId(R.id.sign_in_button)).perform(click())

        Thread.sleep(4000)

        val device = UiDevice.getInstance(InstrumentationRegistry.getInstrumentation())
        // Find and click the first account in the Google Sign-In popup
        val secondAccount = device.findObject(UiSelector().text("Byte Swiper 2"))
        if (secondAccount.exists() && secondAccount.isEnabled) {
            secondAccount.click()
        }

        Thread.sleep(10000)

        onView(withId(R.id.test_user_id)).perform(object : ViewAction {
            override fun getConstraints(): Matcher<View> {
                return isAssignableFrom(TextView::class.java)
            }

            override fun getDescription(): String {
                return "Get userId from TextView"
            }

            override fun perform(uiController: UiController, view: View) {
                val obtainedUserId = (view as TextView).text.toString()

                // Save userId to SharedPreferences
                userId = obtainedUserId

                val context = ApplicationProvider.getApplicationContext<Context>()
                val sharedPreferences = context.getSharedPreferences("TestPrefs", Context.MODE_PRIVATE)
                sharedPreferences.edit().putString("userId2", userId).apply()

                Log.d("CJoinGroupTest", "saving userId: $userId")
            }
        })
        onView(withId(R.id.main_join_group_button)).perform(click())
        Thread.sleep(3000)

        scenario.close()
    }

    private fun startPage() {
        val context = ApplicationProvider.getApplicationContext<Context>()
        val sharedPreferences = context.getSharedPreferences("TestPrefs", Context.MODE_PRIVATE)
        userId = sharedPreferences.getString("userId2", null) ?: "null"
        val intent = Intent(context, JoinGroupPage::class.java).apply {
            putExtra("userId", userId)
            putExtra("userEmail", "byteswiper@gmail.com")
        }
        Log.d("CJoinGroupTest", "current userId: userId: ${sharedPreferences.getString("userId2", null)}")
        mainScenario = ActivityScenario.launch(intent)
    }

    @Test
    fun testB_WorkingUI () {
//        initialize page
        startPage()

        // Title
        onView(withId(R.id.titleText)).check(matches(isDisplayed()))
//      Join Group requirements
        onView(withId(R.id.groupIdInputLayout)).check(matches(isDisplayed()))
        onView(withId(R.id.join_button)).check(matches(isDisplayed()))
        onView(withId(R.id.join_back_button)).check(matches(isDisplayed()))

//        Display user email id (provided by backend)
        onView(withId(R.id.textView13)).check(matches(isDisplayed()))
    }

    @Test
    fun testD_JoinButton() {
//        initialize page
        startPage()

        val context = ApplicationProvider.getApplicationContext<Context>()
        val sharedPreferences = context.getSharedPreferences("TestPrefs", Context.MODE_PRIVATE)
        val joinCode = sharedPreferences.getString("joinCode", "5Z7SJ")

        Log.d("CJoinGroupTest", "joinCode: $joinCode")

        onView(withId(R.id.group_id_input)).perform(typeText(joinCode), closeSoftKeyboard())
        onView(withId(R.id.join_button)).perform(click())
        Thread.sleep(10000)
//        check if we shifted views or not
        Intents.intended(hasComponent(ViewGroupPage::class.java.name))
        mainScenario.close()
    }

    @Test
    fun testC_BadCode() {
//        initialize page
        startPage()

        val scenario = ActivityScenario.launch(JoinGroupPage::class.java)
        onView(withId(R.id.group_id_input)).perform(typeText("12345"), closeSoftKeyboard())
        onView(withId(R.id.join_button)).perform(click())

        Thread.sleep(3000)

        scenario.onActivity {
            activity -> assertThat(activity, instanceOf(JoinGroupPage::class.java))
        }

        mainScenario.close()

    }
}