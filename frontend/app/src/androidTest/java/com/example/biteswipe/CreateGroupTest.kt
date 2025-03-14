package com.example.biteswipe

import androidx.test.core.app.ActivityScenario
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.click
import androidx.test.espresso.action.ViewActions.closeSoftKeyboard
import androidx.test.espresso.action.ViewActions.typeText
import androidx.test.espresso.assertion.ViewAssertions.matches
import androidx.test.espresso.intent.matcher.IntentMatchers.hasComponent
import androidx.test.espresso.matcher.ViewMatchers.isDisplayed
import androidx.test.espresso.matcher.ViewMatchers.withId
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.ext.junit.runners.AndroidJUnit4
import org.hamcrest.Matchers.instanceOf
import org.junit.After

import org.junit.Test
import org.junit.runner.RunWith

import org.junit.Assert.*
import org.junit.Before
import org.junit.Rule

/**
 * Instrumented test, which will execute on an Android device.
 *
 * See [testing documentation](http://d.android.com/tools/testing).
 */
@RunWith(AndroidJUnit4::class)
class CreateGroupTest {
    @get:Rule
    val activityRule = ActivityScenarioRule(CreateGroupPage::class.java)

    @Before
    fun setup() {
        Intents.init()
    }

    @After
    fun tearDown() {
        Intents.release()
    }

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

    @Test
    fun testJoinButton() {
//        input valid group code TODO: Put valid group code here
        onView(withId(R.id.group_id_input)).perform(typeText("123456"), closeSoftKeyboard())
        onView(withId(R.id.join_button)).perform(click())

//        check if we shifted views or not
        Intents.intended(hasComponent(ViewGroupPage::class.java.name))
    }

    @Test
    fun testBadCode() {
        val scenario = ActivityScenario.launch(JoinGroupPage::class.java)
        onView(withId(R.id.group_id_input)).perform(typeText("12345"), closeSoftKeyboard())
        onView(withId(R.id.join_button)).perform(click())

        Thread.sleep(3000)

        scenario.onActivity {
            activity -> assertThat(activity, instanceOf(JoinGroupPage::class.java))
        }

    }
    @Test
    fun useAppContext() {
        // Context of the app under test.
        val appContext = InstrumentationRegistry.getInstrumentation().targetContext
        assertEquals("com.example.biteswipe", appContext.packageName)
    }
}