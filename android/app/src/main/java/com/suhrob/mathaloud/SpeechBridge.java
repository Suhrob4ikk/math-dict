package com.suhrob.mathaloud;

import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Locale;

// Объект window.AndroidSpeech для сайта (lib/android.ts): системное распознавание речи
// (SpeechRecognizer) и озвучка (TextToSpeech). Ответы уходят в window.__androidSpeech(event).
// Методы с @JavascriptInterface вызываются из потока WebView, а SpeechRecognizer живёт только
// в главном потоке — поэтому всё переносим туда через handler.
class SpeechBridge implements RecognitionListener {
    private final MainActivity activity;
    private final WebView web;
    private final Handler main = new Handler(Looper.getMainLooper());

    private SpeechRecognizer recognizer;
    // Запуск, отложенный до ответа на запрос микрофона.
    private Intent pending;
    // Сессия распознавания идёт: сайт ждёт от неё событие end.
    private boolean active;

    private TextToSpeech tts;
    private boolean ttsReady;

    SpeechBridge(MainActivity activity, WebView web) {
        this.activity = activity;
        this.web = web;
        tts = new TextToSpeech(activity, status -> {
            if (status != TextToSpeech.SUCCESS) return;
            int lang = tts.setLanguage(Locale.US);
            ttsReady = lang != TextToSpeech.LANG_MISSING_DATA && lang != TextToSpeech.LANG_NOT_SUPPORTED;
        });
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override public void onStart(String id) {}
            @Override public void onDone(String id) { ttsEnd(id); }
            @Override public void onError(String id) { ttsEnd(id); }
            @Override public void onStop(String id, boolean interrupted) { ttsEnd(id); }
        });
    }

    // ---------- Распознавание ----------

    @JavascriptInterface
    public boolean recognitionAvailable() {
        return SpeechRecognizer.isRecognitionAvailable(activity);
    }

    @JavascriptInterface
    public void start(String lang, int maxResults, boolean preferOffline) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, Math.max(1, maxResults));
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        // Без сети — офлайн-пакет Google, если он скачан.
        intent.putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, preferOffline);
        intent.putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, activity.getPackageName());
        main.post(() -> {
            cancelSession();
            active = true;
            if (activity.ensureMicPermission()) begin(intent);
            else pending = intent;
        });
    }

    void onMicPermission(boolean granted) {
        Intent intent = pending;
        pending = null;
        if (intent == null || !active) return;
        if (granted) begin(intent);
        else finish("not-allowed");
    }

    private void begin(Intent intent) {
        try {
            if (recognizer == null) {
                recognizer = SpeechRecognizer.createSpeechRecognizer(activity);
                recognizer.setRecognitionListener(this);
            }
            recognizer.startListening(intent);
        } catch (Exception e) {
            finish("service-not-allowed");
        }
    }

    @JavascriptInterface
    public void stop() {
        main.post(() -> {
            if (recognizer != null && active) recognizer.stopListening();
            else if (active) finish(null);
        });
    }

    @JavascriptInterface
    public void abort() {
        main.post(() -> {
            if (!active) return;
            cancelSession();
            send(event("end"));
        });
    }

    // Прерывает распознавание без событий (уход со страницы, сворачивание приложения).
    void reset() {
        main.post(() -> {
            cancelSession();
            if (tts != null) tts.stop();
        });
    }

    private void cancelSession() {
        pending = null;
        active = false;
        if (recognizer != null) recognizer.cancel();
    }

    private void finish(String error) {
        if (!active) return;
        active = false;
        if (error != null) send(event("error").putSafe("error", error));
        send(event("end"));
    }

    private void sendResults(Bundle bundle, boolean isFinal) {
        if (!active || bundle == null) return;
        ArrayList<String> texts = bundle.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        if (texts == null || texts.isEmpty() || texts.get(0).trim().isEmpty()) return;
        send(event("result").putSafe("alternatives", new JSONArray(texts)).putSafe("final", isFinal));
    }

    @Override public void onReadyForSpeech(Bundle params) {}
    @Override public void onBeginningOfSpeech() {}
    @Override public void onRmsChanged(float rms) {}
    @Override public void onBufferReceived(byte[] buffer) {}
    @Override public void onEndOfSpeech() {}
    @Override public void onEvent(int type, Bundle params) {}

    @Override
    public void onPartialResults(Bundle partial) {
        sendResults(partial, false);
    }

    @Override
    public void onResults(Bundle results) {
        sendResults(results, true);
        finish(null);
    }

    @Override
    public void onError(int code) {
        if (!active) return;
        String error;
        switch (code) {
            case SpeechRecognizer.ERROR_NO_MATCH:
            case SpeechRecognizer.ERROR_SPEECH_TIMEOUT:
                error = "no-speech";
                break;
            case SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS:
                error = "not-allowed";
                break;
            case SpeechRecognizer.ERROR_NETWORK:
            case SpeechRecognizer.ERROR_NETWORK_TIMEOUT:
            case SpeechRecognizer.ERROR_SERVER:
            case 13: // ERROR_LANGUAGE_UNAVAILABLE: офлайн-пакета нет
            case 12: // ERROR_LANGUAGE_NOT_SUPPORTED
                error = "network";
                break;
            case SpeechRecognizer.ERROR_CLIENT:
                error = "aborted";
                break;
            default:
                error = "other";
        }
        // Занятый распознаватель лучше пересоздать.
        if (code == SpeechRecognizer.ERROR_RECOGNIZER_BUSY || code == SpeechRecognizer.ERROR_CLIENT) {
            if (recognizer != null) recognizer.destroy();
            recognizer = null;
        }
        finish(error);
    }

    // ---------- Озвучка ----------

    @JavascriptInterface
    public boolean ttsAvailable() {
        return tts != null;
    }

    @JavascriptInterface
    public void speak(String text, float rate, String id) {
        main.post(() -> {
            if (!ttsReady) {
                ttsEnd(id);
                return;
            }
            tts.setSpeechRate(rate);
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, id);
        });
    }

    @JavascriptInterface
    public void stopSpeaking() {
        main.post(() -> {
            if (tts != null) tts.stop();
        });
    }

    private void ttsEnd(String id) {
        send(event("tts-end").putSafe("id", id));
    }

    void destroy() {
        cancelSession();
        if (recognizer != null) recognizer.destroy();
        if (tts != null) tts.shutdown();
    }

    // ---------- События для страницы ----------

    private static Event event(String type) {
        return new Event().putSafe("type", type);
    }

    private void send(JSONObject e) {
        String js = "window.__androidSpeech && window.__androidSpeech(" + e + ")";
        main.post(() -> web.evaluateJavascript(js, null));
    }

    private static class Event extends JSONObject {
        Event putSafe(String key, Object value) {
            try {
                put(key, value);
            } catch (JSONException ignored) {
                // Ключи и значения у нас всегда корректные.
            }
            return this;
        }
    }
}
