@echo off

set URL=http://127.0.0.1:8545

for /f "delims=" %%i in ('curl -s -o NUL -w "%%{http_code}" %URL%') do set HTTP_STATUS=%%i


IF %HTTP_STATUS% neq 200 (
    echo Endpoint Dead
) else (
    echo Endpoint Alive
)