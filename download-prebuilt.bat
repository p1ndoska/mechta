@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

set "URL=https://github.com/p1ndoska/mechta/releases/download/images/mechta-prebuilt.tar.gz"
set "FILE=mechta-prebuilt.tar.gz"

if exist "%FILE%" del "%FILE%"

echo Скачивание готовой сборки...
set /a TRY=0
:retry
set /a TRY+=1
curl --ssl-no-revoke -L -f -C - --speed-limit 1024 --speed-time 30 -o "%FILE%" "%URL%"
if not errorlevel 1 goto unpack
if %TRY% GEQ 30 (
  echo Не удалось скачать %FILE%
  exit /b 1
)
echo Обрыв соединения, повтор %TRY%...
timeout /t 3 /nobreak >nul
goto retry

:unpack
echo Распаковка...
if exist backend\prebuilt rmdir /s /q backend\prebuilt
if exist frontend\prebuilt rmdir /s /q frontend\prebuilt
tar -xzf "%FILE%"
if errorlevel 1 (
  echo Архив поврежден, запустите еще раз
  del "%FILE%"
  exit /b 1
)
del "%FILE%"

echo Запуск контейнеров...
docker compose -f docker-compose.yml -f docker-compose.prebuilt.yml up -d --build
if errorlevel 1 exit /b 1

echo.
echo Сайт:    http://localhost:8083
echo API:     http://localhost:3002/api/health
echo БД:      localhost:5435
endlocal
