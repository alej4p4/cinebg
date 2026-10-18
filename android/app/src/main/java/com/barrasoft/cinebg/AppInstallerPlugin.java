package com.barrasoft.cinebg;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

@CapacitorPlugin(name = "AppInstaller")
public class AppInstallerPlugin extends Plugin {

    @PluginMethod
    public void canRequestPackageInstalls(PluginCall call) {
        JSObject ret = new JSObject();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            ret.put("value", getContext().getPackageManager().canRequestPackageInstalls());
        } else {
            ret.put("value", true);
        }
        call.resolve(ret);
    }

    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            }
            call.resolve();
        } catch (Exception e) {
            call.reject("Erro ao abrir configurações: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void installApk(PluginCall call) {
        String filePath = call.getString("filePath");
        if (filePath == null || filePath.isEmpty()) {
            call.reject("filePath é obrigatório");
            return;
        }

        try {
            File file = new File(filePath);
            if (!file.exists() && filePath.startsWith("file://")) {
                file = new File(filePath.substring(7));
            }

            if (!file.exists()) {
                call.reject("Arquivo APK não encontrado: " + file.getAbsolutePath());
                return;
            }

            launchInstaller(file);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Falha ao iniciar instalação: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String downloadUrl = call.getString("url");
        String filename = call.getString("filename", "CineBG-update.apk");

        if (downloadUrl == null || downloadUrl.isEmpty()) {
            call.reject("URL de download é obrigatória");
            return;
        }

        new Thread(() -> {
            try {
                Context context = getContext();
                File targetFile = new File(context.getCacheDir(), filename);
                if (targetFile.exists()) {
                    targetFile.delete();
                }

                String currentUrl = downloadUrl;
                HttpURLConnection conn = null;
                int redirects = 0;

                // Segue redirecionamentos (HTTP 301, 302, 307, 308 - essencial para releases GitHub / S3)
                while (redirects < 6) {
                    URL u = new URL(currentUrl);
                    conn = (HttpURLConnection) u.openConnection();
                    conn.setInstanceFollowRedirects(false);
                    conn.setRequestProperty("User-Agent", "CineBG-AppUpdater/1.0 (Android)");
                    conn.setConnectTimeout(25000);
                    conn.setReadTimeout(30000);
                    conn.connect();

                    int status = conn.getResponseCode();
                    if (status == HttpURLConnection.HTTP_MOVED_TEMP
                            || status == HttpURLConnection.HTTP_MOVED_PERM
                            || status == 307
                            || status == 308) {
                        String location = conn.getHeaderField("Location");
                        conn.disconnect();
                        if (location == null) break;
                        currentUrl = location;
                        redirects++;
                        continue;
                    }
                    break;
                }

                if (conn == null || conn.getResponseCode() < 200 || conn.getResponseCode() >= 300) {
                    call.reject("Servidor retornou erro HTTP: " + (conn != null ? conn.getResponseCode() : -1));
                    return;
                }

                long totalBytes = conn.getContentLengthLong();
                InputStream input = conn.getInputStream();
                FileOutputStream output = new FileOutputStream(targetFile);

                byte[] buffer = new byte[16384];
                long downloadedBytes = 0;
                int count;
                long lastNotifyTime = 0;

                while ((count = input.read(buffer)) != -1) {
                    output.write(buffer, 0, count);
                    downloadedBytes += count;

                    long now = System.currentTimeMillis();
                    if (now - lastNotifyTime > 150 || downloadedBytes == totalBytes) {
                        lastNotifyTime = now;
                        int percent = totalBytes > 0 ? (int) ((downloadedBytes * 100) / totalBytes) : 0;
                        JSObject progressObj = new JSObject();
                        progressObj.put("percent", percent);
                        progressObj.put("bytesDownloaded", downloadedBytes);
                        progressObj.put("totalBytes", totalBytes);
                        notifyListeners("downloadProgress", progressObj);
                    }
                }

                output.flush();
                output.close();
                input.close();
                conn.disconnect();

                // Lança instalador nativo no thread principal
                getActivity().runOnUiThread(() -> {
                    try {
                        launchInstaller(targetFile);
                        JSObject ret = new JSObject();
                        ret.put("success", true);
                        ret.put("filePath", targetFile.getAbsolutePath());
                        call.resolve(ret);
                    } catch (Exception e) {
                        call.reject("Erro ao abrir instalador do Android: " + e.getMessage(), e);
                    }
                });

            } catch (Exception e) {
                call.reject("Falha no download da atualização: " + e.getMessage(), e);
            }
        }).start();
    }

    private void launchInstaller(File apkFile) {
        Context context = getContext();
        Uri apkUri;

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            apkUri = FileProvider.getUriForFile(
                context,
                context.getPackageName() + ".fileprovider",
                apkFile
            );
        } else {
            apkUri = Uri.fromFile(apkFile);
        }

        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        context.startActivity(intent);
    }
}
