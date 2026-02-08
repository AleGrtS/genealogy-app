#!/bin/bash
IP=$(hostname -I | awk '{print $1}')
echo "==================================="
echo "🌳 Genealogy App - Доступ с телефона"
echo "==================================="
echo "📱 Откройте на телефоне:"
echo "http://$IP:5173"
echo "==================================="
if command -v qrencode &> /dev/null; then
    echo "📸 Или отсканируйте QR-код:"
    qrencode -t ANSI "http://$IP:5173"
else
    echo "💡 Установите qrencode для QR-кода:"
    echo "sudo apt install qrencode"
fi
echo "==================================="
