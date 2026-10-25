import java.util.Properties

plugins {
    id("com.android.application")
}

// Ключ подписи хранится вне репозитория: путь к keystore.properties — в переменной
// MATH_ALOUD_KEYSTORE или рядом, в android/keystore.properties. Без него собирается
// только debug-сборка.
val keystoreFile = file(System.getenv("MATH_ALOUD_KEYSTORE") ?: "../keystore.properties")
val keystore = Properties().apply { if (keystoreFile.exists()) keystoreFile.inputStream().use { load(it) } }

android {
    namespace = "com.suhrob.mathaloud"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.suhrob.mathaloud"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    signingConfigs {
        if (keystore.isNotEmpty()) {
            create("release") {
                storeFile = keystoreFile.resolveSibling(keystore.getProperty("storeFile"))
                storePassword = keystore.getProperty("storePassword")
                keyAlias = keystore.getProperty("keyAlias")
                keyPassword = keystore.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            if (keystore.isNotEmpty()) signingConfig = signingConfigs.getByName("release")
        }
    }

    buildFeatures {
        buildConfig = true
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
