@echo off
rem 연구실 안전 OX 퀴즈 - 전체화면(키오스크) 실행
rem 종료: Alt + F4
set "PAGE=%~dp0index.html"
set "PROFILE=%~dp0.browser-profile"
set "FLAGS=--kiosk --no-first-run --disable-pinch --overscroll-history-navigation=0 --disable-translate --autoplay-policy=no-user-gesture-required --user-data-dir="%PROFILE%""

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" %FLAGS% "%PAGE%"
  exit /b
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" %FLAGS% "%PAGE%"
  exit /b
)
start "" msedge %FLAGS% --edge-kiosk-type=fullscreen "%PAGE%"
