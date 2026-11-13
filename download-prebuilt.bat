@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

rem Архив backend node_modules. Имя берется из prebuilt.txt и меняется только при смене зависимостей.
rem Сайт (frontend\dist) приходит через git pull.
set /p FILE=<prebuilt.txt
set "URL=https://github.com/p1ndoska/mechta/releases/download/images/%FILE%"

set "CURRENT="
if exist backend\prebuilt\version.txt set /p CURRENT=<backend\prebuilt\version.txt
if "%CURRENT%"=="%FILE%" (
  echo Пакеты backend уже актуальные, скачивание не нужно
  goto start
)

if exist "%FILE%" del "%FILE%"

echo Скачивание пакетов backend %FILE%...
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
echo Проверка архива...
tar -tzf "%FILE%" >nul
if errorlevel 1 (
  echo Файл скачался не полностью, запустите download-prebuilt.bat еще раз
  del "%FILE%"
  exit /b 1
)

echo Распаковка...
if exist backend\prebuilt rmdir /s /q backend\prebuilt
if exist frontend\prebuilt rmdir /s /q frontend\prebuilt
tar -xzf "%FILE%"
if errorlevel 1 (
  echo Ошибка распаковки, пришлите сообщения выше
  exit /b 1
)
del "%FILE%"
>backend\prebuilt\version.txt echo %FILE%

:start
echo Запуск контейнеров...
docker compose up -d --build
if errorlevel 1 exit /b 1

echo.
echo Сайт:    http://localhost:8083
echo API:     http://localhost:3002/api/health
echo БД:      localhost:5435
endlocal
