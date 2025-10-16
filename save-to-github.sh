#!/bin/bash
MESSAGE="$1"
if [ -z "$MESSAGE" ]; then
    MESSAGE="📝 Автосохранение $(date '+%Y-%m-%d %H:%M')"
fi

echo "💾 Сохраняем изменения в GitHub..."
git add .
git commit -m "$MESSAGE"
git push origin main
echo "✅ Успешно сохранено: $MESSAGE"
echo "🔗 Репозиторий: https://github.com/Brandowner/agentrouter-token-counter"
