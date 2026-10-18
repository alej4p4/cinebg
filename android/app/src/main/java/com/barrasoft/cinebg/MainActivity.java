package com.barrasoft.cinebg;

import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        registerPlugin(AppInstallerPlugin.class);
        super.onCreate(savedInstanceState);
        setupImmersiveMode();
        setupTvFocus();
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int keyCode = event.getKeyCode();
        int action = event.getAction();

        // Teclas direcionais de controle remoto (D-Pad), Enter e Menu
        String keyName = null;
        switch (keyCode) {
            case KeyEvent.KEYCODE_DPAD_UP:
                keyName = "ArrowUp";
                break;
            case KeyEvent.KEYCODE_DPAD_DOWN:
                keyName = "ArrowDown";
                break;
            case KeyEvent.KEYCODE_DPAD_LEFT:
                keyName = "ArrowLeft";
                break;
            case KeyEvent.KEYCODE_DPAD_RIGHT:
                keyName = "ArrowRight";
                break;
            case KeyEvent.KEYCODE_DPAD_CENTER:
            case KeyEvent.KEYCODE_ENTER:
            case KeyEvent.KEYCODE_NUMPAD_ENTER:
            case KeyEvent.KEYCODE_BUTTON_A:
            case KeyEvent.KEYCODE_BUTTON_SELECT:
                keyName = "Enter";
                break;
            case KeyEvent.KEYCODE_MENU:
                keyName = "ContextMenu";
                break;
            case KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE:
                keyName = "MediaPlayPause";
                break;
            case KeyEvent.KEYCODE_MEDIA_PLAY:
                keyName = "MediaPlay";
                break;
            case KeyEvent.KEYCODE_MEDIA_PAUSE:
                keyName = "MediaPause";
                break;
            case KeyEvent.KEYCODE_MEDIA_FAST_FORWARD:
                keyName = "MediaFastForward";
                break;
            case KeyEvent.KEYCODE_MEDIA_REWIND:
                keyName = "MediaRewind";
                break;
        }

        if (keyName != null) {
            final String jsKey = keyName;
            final String eventType = (action == KeyEvent.ACTION_DOWN) ? "keydown" : "keyup";
            final int jsCode = keyCode;

            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().post(new Runnable() {
                    @Override
                    public void run() {
                        try {
                            String js = "window.dispatchEvent(new KeyboardEvent('" + eventType + "', {" +
                                "key: '" + jsKey + "'," +
                                "code: '" + jsKey + "'," +
                                "keyCode: " + jsCode + "," +
                                "which: " + jsCode + "," +
                                "bubbles: true," +
                                "cancelable: true" +
                            "}));";
                            getBridge().getWebView().evaluateJavascript(js, null);
                        } catch (Exception ignored) {}
                    }
                });
                return true;
            }
        }

        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onResume() {
        super.onResume();
        setupTvFocus();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            setupImmersiveMode();
            setupTvFocus();
        }
    }

    private void setupTvFocus() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                android.webkit.WebView webView = getBridge().getWebView();
                webView.setFocusable(true);
                webView.setFocusableInTouchMode(true);
                webView.requestFocus();
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                if (webView.getSettings() != null) {
                    webView.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                    webView.getSettings().setSupportMultipleWindows(false);
                    webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
                }
            }
        } catch (Exception ignored) {}
    }

    private void setupImmersiveMode() {
        Window window = getWindow();
        if (window == null) return;

        // Permite desenhar de ponta a ponta na tela (Edge-to-Edge) e cobrir a área do notch/câmera
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            window.getAttributes().layoutInDisplayCutoutMode =
                WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        // Garante barra de navegação transparente/preta sem fundo branco
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            window.setNavigationBarColor(android.graphics.Color.BLACK);
            window.setStatusBarColor(android.graphics.Color.BLACK);
        }

        // Esconde barra de navegação virtual (<, O, |||) e barra de status em modo imersivo sticky
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController controller = window.getInsetsController();
            if (controller != null) {
                controller.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                controller.setSystemBarsBehavior(
                    WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
                );
            }
        } else {
            View decorView = window.getDecorView();
            decorView.setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_FULLSCREEN
            );
        }
    }
}
