@echo off
cd /d C:\inetpub\wwwroot\websters.ae\httpdocs\admin-panel-node

echo Pulling latest code...
git pull origin main

echo Installing dependencies...
call npm i --no-audit --no-fund

echo Restarting Node service...
nssm restart admin-panel-node

echo Done.
