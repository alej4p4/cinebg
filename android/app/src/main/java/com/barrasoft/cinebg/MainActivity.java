package com.barrasoft.cinebg;

import android.os.Build;
import android.os.Bundle;
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
