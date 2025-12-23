@echo off
echo ====================================
echo Markdown2WeChat Docker 启动脚本
echo ====================================
echo.

echo 正在启动 Docker Compose...
docker-compose up -d

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ====================================
    echo 服务启动成功！
    echo 访问地址: http://localhost:8000
    echo ====================================
    echo.
    echo 查看日志: docker-compose logs -f
    echo 停止服务: docker-compose down
) else (
    echo.
    echo ====================================
    echo 启动失败，请检查Docker是否运行
    echo ====================================
)

pause

