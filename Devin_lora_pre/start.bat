@echo off
setlocal

echo [LoRA Dataset Preparer] 正在检查 Node.js...
where node >nul 2>nul
if errorlevel 1 (
  echo 未检测到 Node.js，请先安装 Node.js 18+ 后再运行本文件。
  pause
  exit /b 1
)

echo [1/3] 检查依赖...
if not exist node_modules (
  echo 未检测到 node_modules，正在安装依赖...
  call npm install
  if errorlevel 1 (
    echo 依赖安装失败，请检查网络或 npm 配置。
    pause
    exit /b 1
  )
) else (
  echo 已检测到依赖，跳过 npm install。
)

echo [2/3] 正在启动开发服务器...
start "LoRA Dataset Preparer" cmd /k "npm run dev"

echo [3/3] 等待服务启动...
timeout /t 5 /nobreak >nul

echo 正在打开浏览器：http://localhost:3000
start http://localhost:3000

pause
