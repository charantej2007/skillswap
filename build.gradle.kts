// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.compose) apply false
}

// These properties are expected by the Capacitor android project
extra.apply {
    set("compileSdkVersion", 36)
    set("targetSdkVersion", 36)
    set("minSdkVersion", 24)
    set("androidxAppCompatVersion", "1.7.0")
    set("androidxCoordinatorLayoutVersion", "1.2.0")
    set("coreSplashScreenVersion", "1.0.1")
    set("androidxJunitVersion", "1.2.1")
    set("androidxEspressoCoreVersion", "3.6.1")
    set("junitVersion", "4.13.2")
}
