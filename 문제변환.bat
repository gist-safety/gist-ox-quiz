@echo off
chcp 65001 >nul
cd /d "%~dp0"
python 문제변환.py %*
pause
