package com.barrasoft.cinebg;

import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.view.KeyEvent;
import android.view.View;
import android.view.Window;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;

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

    private static final String[] AD_HOST_KEYWORDS = new String[] {
        "doubleclick", "googlesyndication", "googleadservices", "popads", "adsterra",
        "propellerads", "onclickmega", "exoclick", "juicyads", "monetag", "trafficjunky",
        "bet365", "1xbet", "betano", "blaze", "adtrue", "histats", "adnxs", "adform",
        "cpmstar", "hilltopads", "adcash", "bidvertiser", "clickadu", "popcash",
        "ad-delivery", "magsrv", "tsyndicate", "adservice", "adsystem",
        "streamad", "vpaid", "vast", "adroll", "smartadserver", "outbrain", "taboola",
        "trafficstars", "zeroredirect", "richpush", "rtbdemand", "adkeeper", "adblade",
        "openx", "rubiconproject", "pubmatic", "revcontent", "yieldmo", "inmobi", "adnetwork",
        "betfair", "betway", "sportingbet", "bodog", "betsson", "kto", "parimatch",
        "cassino", "casino", "roleta", "apostas", "aviator", "tigrinho", "fortune-tiger",
        "playreplay", "midroll", "preroll", "postroll", "alwingulla", "topcreativeformat",
        "creativecdn", "directrev", "highperformancegate", "whomeeto", "syndication",
        "banner", "adclick", "clickserver", "adtracker", "affiliate", "landing",
        "popmyads", "plugrush", "yllix", "admaven", "admob", "startapp", "unityads",
        "applovin", "ironsource", "fyber", "chartboost", "vungle", "tapjoy", "mintegral",
        "pangle", "yandex", "anonymizer", "coinhive", "coinimp", "crypto-loot",
        "adkeep", "pemsrv", "adtng", "ad-score", "adtarget", "adfactor", "adnuntius",
        "outstream", "vidoomy", "in-page-push", "pushnotification", "adserver",
        "videoshare", "streamshield", "clck"
    };

    private static boolean isAdUrl(String url) {
        if (url == null) return false;
        String lower = url.toLowerCase();

        // NUNCA bloquear provedores de streaming, CDNs ou scripts de players legítimos
        if (lower.contains("mgeb.site") || lower.contains("megaembed") ||
            lower.contains("fontedecanais") || lower.contains("dramasfree") ||
            lower.contains("vidlink") || lower.contains("vidsrc") ||
            lower.contains("vsembed") || lower.contains("multiembed") ||
            lower.contains("megatube")) {
            return false;
        }

        for (String keyword : AD_HOST_KEYWORDS) {
            if (lower.contains(keyword)) {
                return true;
            }
        }
        if (lower.contains("/pop.") || lower.contains("/popunder") || lower.contains("/popup") ||
            lower.contains("ad.js") || lower.contains("ads.js") || lower.contains("ads.min.js") ||
            lower.contains("banner.js") || lower.contains("tracking.js") || lower.contains("tracker.js") ||
            lower.contains("advert") || lower.contains("vast.xml") || lower.contains("vpaid.js")) {
            return true;
        }
        return false;
    }

    private boolean adBlockerInstalled = false;

    private void setupTvFocus() {
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                WebView webView = getBridge().getWebView();
                webView.setFocusable(true);
                webView.setFocusableInTouchMode(true);
                webView.requestFocus();
                webView.setLayerType(View.LAYER_TYPE_HARDWARE, null);
                if (webView.getSettings() != null) {
                    webView.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                    webView.getSettings().setSupportMultipleWindows(false);
                    webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
                    webView.getSettings().setDomStorageEnabled(true);
                    webView.getSettings().setDatabaseEnabled(true);
                    // Disfarça User-Agent para Chrome completo sem "Version/4.0" nem "; wv;", impedindo detecção de WebView
                    webView.getSettings().setUserAgentString("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
                }

                if (!adBlockerInstalled) {
                    adBlockerInstalled = true;

                    // Bloqueio rigoroso de pop-ups, novas janelas e alertas de spam (Chrome Client)
                    webView.setWebChromeClient(new WebChromeClient() {
                        @Override
                        public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                            return false; // Bloqueia 100% de novas abas/janelas de anúncios
                        }

                        @Override
                        public boolean onJsAlert(WebView view, String url, String message, android.webkit.JsResult result) {
                            result.confirm();
                            return true;
                        }

                        @Override
                        public boolean onJsConfirm(WebView view, String url, String message, android.webkit.JsResult result) {
                            result.confirm();
                            return true;
                        }

                        @Override
                        public boolean onJsPrompt(WebView view, String url, String message, String defaultValue, android.webkit.JsPromptResult result) {
                            result.cancel();
                            return true;
                        }
                    });

                    // Bloqueio de rede nativo de URLs de anúncios, redirecionamentos e sequestro de tela
                    webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
                        @Override
                        public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                            if (request != null && request.getUrl() != null) {
                                String url = request.getUrl().toString();
                                if (isAdUrl(url)) {
                                    return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream("".getBytes()));
                                }
                            }
                            return super.shouldInterceptRequest(view, request);
                        }

                        @Override
                        public WebResourceResponse shouldInterceptRequest(WebView view, String url) {
                            if (url != null && isAdUrl(url)) {
                                return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream("".getBytes()));
                            }
                            return super.shouldInterceptRequest(view, url);
                        }

                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                            if (request != null && request.getUrl() != null) {
                                String url = request.getUrl().toString();
                                String scheme = request.getUrl().getScheme();

                                // Bloqueia intents externos (Play Store, cassinos, etc.)
                                if (url.startsWith("intent:") || url.startsWith("market:") || "market".equalsIgnoreCase(scheme)) {
                                    return true;
                                }

                                // Se for tentativa de navegação no frame principal para fora do app local (anúncio tentando tomar a tela)
                                if (request.isForMainFrame()) {
                                    String host = request.getUrl().getHost();
                                    if (host != null && !host.contains("localhost") && !host.contains("127.0.0.1") && !url.startsWith("capacitor:")) {
                                        return true; // Bloqueia sequestro de tela pelo player/anúncio
                                    }
                                }

                                if (url.contains("sandbox.php") || url.contains("bloqueio")) {
                                    return true; // Bloqueia tentativa de redirecionar para tela de bloqueio de app
                                }

                                if (isAdUrl(url) || url.contains("bet") || url.contains("pop")) {
                                    return true;
                                }
                            }
                            return super.shouldOverrideUrlLoading(view, request);
                        }

                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, String url) {
                            if (url != null) {
                                if (url.contains("sandbox.php") || url.contains("bloqueio")) {
                                    return true;
                                }
                                if (url.startsWith("intent:") || url.startsWith("market:") || isAdUrl(url)) {
                                    return true;
                                }
                                if (!url.contains("localhost") && !url.contains("127.0.0.1") && !url.startsWith("capacitor:")) {
                                    return true; // Protege WebView em versões legadas do Android
                                }
                            }
                            return super.shouldOverrideUrlLoading(view, url);
                        }

                        @Override
                        public void onPageFinished(WebView view, String url) {
                            super.onPageFinished(view, url);
                        }
                    });
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
