package com.suhrob.mathaloud;

import android.Manifest;
import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.PermissionRequest;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

// Приложение — это сайт math-dict.vercel.app в WebView. Офлайн-режим даёт service worker сайта,
// а распознавание и озвучку речи, которых в WebView нет, — SpeechBridge через Android.
public class MainActivity extends Activity {
    static final String HOST = "math-dict.vercel.app";
    private static final String START_URL = "https://" + HOST + "/";
    private static final int MIC_REQUEST = 1;

    private WebView web;
    private SpeechBridge speech;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        Window window = getWindow();
        window.getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR);

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUserAgentString(s.getUserAgentString() + " MathAloudApp/" + BuildConfig.VERSION_NAME);

        speech = new SpeechBridge(this, web);
        web.addJavascriptInterface(speech, "AndroidSpeech");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if (HOST.equals(url.getHost())) return false;
                // Внешние ссылки — в браузере.
                try {
                    startActivity(new Intent(Intent.ACTION_VIEW, url));
                } catch (Exception ignored) {
                    // Нечем открыть — остаёмся на месте.
                }
                return true;
            }

            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                // Новая страница — прошлую фразу больше никто не ждёт.
                speech.reset();
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(PermissionRequest request) {
                request.deny();
            }
        });

        if (state != null) web.restoreState(state);
        else web.loadUrl(START_URL);
    }

    // Просит доступ к микрофону; ответ придёт в onRequestPermissionsResult.
    boolean ensureMicPermission() {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) return true;
        requestPermissions(new String[] {Manifest.permission.RECORD_AUDIO}, MIC_REQUEST);
        return false;
    }

    @Override
    public void onRequestPermissionsResult(int code, String[] permissions, int[] results) {
        if (code != MIC_REQUEST) return;
        boolean granted = results.length > 0 && results[0] == PackageManager.PERMISSION_GRANTED;
        speech.onMicPermission(granted);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onPause() {
        speech.reset();
        super.onPause();
    }

    @Override
    protected void onDestroy() {
        speech.destroy();
        web.destroy();
        super.onDestroy();
    }
}
