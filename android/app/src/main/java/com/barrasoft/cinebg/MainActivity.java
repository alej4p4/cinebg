package com.barrasoft.cinebg;

import android.app.UiModeManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.res.Configuration;
import android.os.Build;
import android.os.Bundle;
import android.os.Message;
import android.provider.Settings;
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
    private static final String PREFS_NAME = "cinebg_device_prefs";
    private static final String KEY_FIRST_INSTALL_TIME = "first_install_time";
    private static final String KEY_LAST_VERSION_CODE = "last_installed_version_code";
    private static final String KEY_SAVED_LICENSE = "saved_vip_license";
    private static final String KEY_DEVICE_ID = "hardware_device_id";
    private static final long MIN_VALID_TIMESTAMP = 1577836800000L; // 2020-01-01

    public static boolean isRealTelevisionDevice(Context context) {
        if (context == null) return false;
        try {
            UiModeManager uiModeManager = (UiModeManager) context.getSystemService(Context.UI_MODE_SERVICE);
            if (uiModeManager != null && uiModeManager.getCurrentModeType() == Configuration.UI_MODE_TYPE_TELEVISION) {
                return true;
            }
            PackageManager pm = context.getPackageManager();
            if (pm != null) {
                if (pm.hasSystemFeature(PackageManager.FEATURE_LEANBACK)) {
                    return true;
                }
                // Celulares possuem rádio de telefonia móvel (SIM/GSM/LTE); Smart TVs e TV Boxes não possuem
                if (pm.hasSystemFeature(PackageManager.FEATURE_TELEPHONY)) {
                    return false;
                }
                // Se NÃO tiver touchscreen, é um dispositivo fixo / TV Box
                if (!pm.hasSystemFeature(PackageManager.FEATURE_TOUCHSCREEN)) {
                    return true;
                }
            }
        } catch (Exception ignored) {}
        return false;
    }

    /**
     * Resolve e persiste a data/hora real da primeira instalação do CineBG no aparelho,
     * consultando tanto o PackageManager do Android (que preserva firstInstallTime entre atualizações de APK)
     * quanto pacotes irmãos (Mobile/TV) e SharedPreferences.
     */
    public static synchronized long resolvePersistentFirstInstallTime(Context context) {
        if (context == null) return System.currentTimeMillis();
        long earliest = Long.MAX_VALUE;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            long stored = prefs.getLong(KEY_FIRST_INSTALL_TIME, 0L);
            if (stored > MIN_VALID_TIMESTAMP) {
                earliest = Math.min(earliest, stored);
            }

            PackageManager pm = context.getPackageManager();
            if (pm != null) {
                String[] candidatePackages = new String[] {
                    context.getPackageName(),
                    "com.barrasoft.cinebg",
                    "com.barrasoft.cinebg.tv"
                };
                for (String pkg : candidatePackages) {
                    try {
                        PackageInfo info = pm.getPackageInfo(pkg, 0);
                        if (info != null && info.firstInstallTime > MIN_VALID_TIMESTAMP) {
                            earliest = Math.min(earliest, info.firstInstallTime);
                        }
                    } catch (Exception ignored) {}
                }
            }

            if (earliest == Long.MAX_VALUE || earliest <= MIN_VALID_TIMESTAMP) {
                earliest = System.currentTimeMillis();
            }

            if (stored <= MIN_VALID_TIMESTAMP || earliest < stored) {
                prefs.edit().putLong(KEY_FIRST_INSTALL_TIME, earliest).apply();
            }
        } catch (Exception ignored) {
            if (earliest == Long.MAX_VALUE) {
                earliest = System.currentTimeMillis();
            }
        }
        return earliest;
    }

    public static synchronized String resolveHardwareDeviceId(Context context) {
        if (context == null) return "cinebg_unknown";
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
            String cached = prefs.getString(KEY_DEVICE_ID, null);
            if (cached != null && !cached.trim().isEmpty()) {
                return cached;
            }
            String androidId = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ANDROID_ID);
            String resolved;
            if (androidId != null && !androidId.trim().isEmpty() && !"9774d56d682e549c".equalsIgnoreCase(androidId)) {
                resolved = "cinebg_" + androidId.trim().toLowerCase();
            } else {
                resolved = "cinebg_" + Long.toString(resolvePersistentFirstInstallTime(context), 36);
            }
            prefs.edit().putString(KEY_DEVICE_ID, resolved).apply();
            return resolved;
        } catch (Exception ignored) {
            return "cinebg_android";
        }
    }

    private boolean isVideoPlayerLandscape = false;

    private void applyDeviceOrientation() {
        try {
            boolean isTv = isRealTelevisionDevice(this);
            if (isTv || isVideoPlayerLandscape) {
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE);
            } else {
                setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            }
        } catch (Exception ignored) {}
    }

    /**
     * Se o usuário em um celular estava com o pacote legado de TV ("com.barrasoft.cinebg.tv") aberto
     * e já instalou o pacote correto de celular ("com.barrasoft.cinebg"), redireciona automaticamente
     * para o novo app Mobile para nunca voltar à versão antiga.
     */
    private boolean redirectLegacyPackageIfNecessary() {
        return false;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        resolvePersistentFirstInstallTime(this);
        registerPlugin(AppInstallerPlugin.class);
        super.onCreate(savedInstanceState);
        setupImmersiveMode();
        setupTvFocus();

        // Identifica formalmente o sabor (Mobile vs TV)
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            try {
                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                int lastCode = prefs.getInt(KEY_LAST_VERSION_CODE, -1);
                if (lastCode != BuildConfig.VERSION_CODE) {
                    prefs.edit().putInt(KEY_LAST_VERSION_CODE, BuildConfig.VERSION_CODE).apply();
                    webView.clearCache(true);
                }
            } catch (Exception ignored) {}

            String currentUa = webView.getSettings().getUserAgentString();
            boolean isTv = isRealTelevisionDevice(this);
            String flavorTag = isTv ? " CineBG-TV DeviceType/TV" : " CineBG-Mobile DeviceType/Mobile";
            if (!currentUa.contains("CineBG-")) {
                webView.getSettings().setUserAgentString(currentUa + flavorTag);
            }

        }
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            if (!webView.hasFocus()) {
                webView.requestFocus();
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public void onResume() {
        super.onResume();
        if (redirectLegacyPackageIfNecessary()) {
            return;
        }
        applyDeviceOrientation();
        setupTvFocus();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            applyDeviceOrientation();
            setupImmersiveMode();
            setupTvFocus();
        }
    }

    private static final String[] AD_HOST_KEYWORDS = new String[] {
        "doubleclick", "googlesyndication", "googleadservices", "popads", "adsterra",
        "propellerads", "onclickmega", "exoclick", "juicyads", "monetag", "trafficjunky",
        "bet365", "1xbet", "1xbt", "xbet", "melbet", "mostbet", "linebet", "betwinner",
        "22bet", "megapari", "888starz", "betano", "blaze", "adtrue", "histats", "adnxs", "adform",
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

        // Bloqueia imediatamente qualquer propaganda de casas de apostas (1xBet / 1xbt / etc.) ou preroll
        // mesmo que o arquivo termine em .mp4 ou .m3u8
        if (lower.contains("1xbet") || lower.contains("1xbt") || lower.contains("xbet") ||
            lower.contains("melbet") || lower.contains("mostbet") || lower.contains("linebet") ||
            lower.contains("betwinner") || lower.contains("22bet") || lower.contains("megapari") ||
            lower.contains("888starz") || lower.contains("bet365") || lower.contains("betano") ||
            lower.contains("preroll") || lower.contains("midroll") || lower.contains("vast.xml") ||
            lower.contains("vpaid")) {
            return true;
        }

        // NUNCA bloquear provedores de streaming, CDNs ou scripts de players legítimos
        if (lower.contains(".m3u8") || lower.contains(".ts") ||
            lower.contains(".mp4") || lower.contains(".aac") ||
            lower.contains(".m4s") ||
            lower.contains("mgeb.site") || lower.contains("megaembed") ||
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
                if (webView.getSettings() != null) {
                    webView.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                    webView.getSettings().setSupportMultipleWindows(false);
                    webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
                    webView.getSettings().setDomStorageEnabled(true);
                    webView.getSettings().setDatabaseEnabled(true);
                    webView.getSettings().setRenderPriority(android.webkit.WebSettings.RenderPriority.HIGH);
                    webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
                    String currentUa = webView.getSettings().getUserAgentString();
                    if (!currentUa.contains("CineBG-")) {
                        boolean isTv = isRealTelevisionDevice(MainActivity.this);
                        String flavorTag = isTv ? " CineBG-TV DeviceType/TV" : " CineBG-Mobile DeviceType/Mobile";
                        webView.getSettings().setUserAgentString(currentUa + flavorTag);
                    }
                }

                if (!adBlockerInstalled) {
                    adBlockerInstalled = true;

                    // Ponte nativa síncrona para o JavaScript identificar dispositivo, versão real do APK e licença/trial
                    webView.addJavascriptInterface(new Object() {
                        @android.webkit.JavascriptInterface
                        public String getDeviceType() {
                            return isRealTelevisionDevice(MainActivity.this) ? "tv" : "mobile";
                        }

                        @android.webkit.JavascriptInterface
                        public boolean isTv() {
                            return isRealTelevisionDevice(MainActivity.this);
                        }

                        @android.webkit.JavascriptInterface
                        public boolean isMobile() {
                            return !isRealTelevisionDevice(MainActivity.this);
                        }

                        @android.webkit.JavascriptInterface
                        public String getAppVersion() {
                            return BuildConfig.VERSION_NAME;
                        }

                        @android.webkit.JavascriptInterface
                        public int getAppVersionCode() {
                            return BuildConfig.VERSION_CODE;
                        }

                        @android.webkit.JavascriptInterface
                        public long getFirstInstallTime() {
                            return resolvePersistentFirstInstallTime(MainActivity.this);
                        }

                        @android.webkit.JavascriptInterface
                        public long syncFirstInstallTime(long jsTimestamp) {
                            long nativeTs = resolvePersistentFirstInstallTime(MainActivity.this);
                            if (jsTimestamp > MIN_VALID_TIMESTAMP && jsTimestamp < nativeTs) {
                                try {
                                    SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                                    prefs.edit().putLong(KEY_FIRST_INSTALL_TIME, jsTimestamp).apply();
                                    return jsTimestamp;
                                } catch (Exception ignored) {}
                            }
                            return nativeTs;
                        }

                        @android.webkit.JavascriptInterface
                        public String getHardwareDeviceId() {
                            return resolveHardwareDeviceId(MainActivity.this);
                        }

                        @android.webkit.JavascriptInterface
                        public String getSavedLicense() {
                            try {
                                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                                return prefs.getString(KEY_SAVED_LICENSE, "");
                            } catch (Exception ignored) {
                                return "";
                            }
                        }

                        @android.webkit.JavascriptInterface
                        public void saveLicense(String licenseJson) {
                            try {
                                SharedPreferences prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
                                prefs.edit().putString(KEY_SAVED_LICENSE, licenseJson != null ? licenseJson : "").apply();
                            } catch (Exception ignored) {}
                        }

                        @android.webkit.JavascriptInterface
                        public void setPlayerLandscape(final boolean landscape) {
                            isVideoPlayerLandscape = landscape;
                            runOnUiThread(() -> {
                                applyDeviceOrientation();
                                setupImmersiveMode();
                            });
                        }
                    }, "CineBGNative");
                }
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onTrimMemory(int level) {
        super.onTrimMemory(level);
        try {
            if (level >= android.content.ComponentCallbacks2.TRIM_MEMORY_RUNNING_LOW) {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().clearCache(false);
                }
                System.gc();
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onLowMemory() {
        super.onLowMemory();
        try {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().clearCache(false);
                getBridge().getWebView().freeMemory();
            }
            System.gc();
        } catch (Exception ignored) {}
    }

    private void setupImmersiveMode() {
        Window window = getWindow();
        if (window == null) return;

        boolean isTv = isRealTelevisionDevice(this);
        boolean shouldHideSystemBars = isTv || isVideoPlayerLandscape;

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

        if (!shouldHideSystemBars) {
            // Em celulares fora do player de vídeo, mantém a tela em retrato normal com barras do sistema visíveis
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                WindowInsetsController controller = window.getInsetsController();
                if (controller != null) {
                    controller.show(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                }
            } else {
                View decorView = window.getDecorView();
                decorView.setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
            }
            return;
        }

        // Na TV ou dentro do player de vídeo em tela cheia, esconde barras em modo imersivo sticky
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
