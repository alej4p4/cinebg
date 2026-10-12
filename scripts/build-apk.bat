@echo off
echo =======================================
echo     CineBG - Build APK script
echo =======================================

echo.
echo 1. Buildando projeto React...
call npm run build

echo.
echo 2. Sincronizando com Capacitor (Android)...
call npx cap sync android

echo.
echo 3. Buildando APK via Gradle...
cd android
call gradlew assembleDebug
cd ..

echo.
echo =======================================
echo Build concluido! 
echo O arquivo APK estara em: android\app\build\outputs\apk\debug\app-debug.apk
echo =======================================
pause
