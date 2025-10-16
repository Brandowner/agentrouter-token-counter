/**
 * AgentRouter + Token Counter Integration
 *
 * Этот файл демонстрирует интеграцию Token Counter с AgentRouter API
 * для автоматического отслеживания использования токенов и стоимости
 *
 * Настройка:
 * 1. Установите переменные окружения:
 *    export ANTHROPIC_API_KEY="your-api-key"
 *    export ANTHROPIC_BASE_URL="https://agentrouter.org/v1"
 *
 * 2. Установите зависимости:
 *    npm install @anthropic-ai/sdk
 *
 * 3. Запустите:
 *    node agentrouter-integration.js
 */

const TokenCounter = require('./token-counter');
const Anthropic = require('@anthropic-ai/sdk');

// Создаем глобальный экземпляр счетчика
const tokenCounter = new TokenCounter({
  historyFile: './agentrouter-token-history.json'
});

// Конфигурация AgentRouter
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || 'https://agentrouter.org/v1';

// Проверка наличия API ключа
if (!ANTHROPIC_API_KEY) {
  console.error('❌ Ошибка: ANTHROPIC_API_KEY не установлен!');
  console.error('   Установите переменную окружения:');
  console.error('   export ANTHROPIC_API_KEY="your-api-key"');
  process.exit(1);
}

// Инициализация Anthropic клиента с AgentRouter
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  baseURL: ANTHROPIC_BASE_URL
});

console.log('🚀 AgentRouter Token Counter Integration');
console.log('='.repeat(60));
console.log(`📡 API Endpoint: ${ANTHROPIC_BASE_URL}`);
console.log(`🔑 API Key: ${ANTHROPIC_API_KEY.substring(0, 10)}...`);
console.log('='.repeat(60) + '\n');

/**
 * Вызов AgentRouter API с автоматическим отслеживанием токенов
 *
 * @param {string} prompt - Текст запроса
 * @param {Object} options - Дополнительные параметры
 * @param {string} options.model - Модель для использования (по умолчанию: claude-sonnet-4-5)
 * @param {number} options.maxTokens - Максимальное количество токенов в ответе
 * @param {number} options.temperature - Температура генерации (0-1)
 * @returns {Promise<string>} - Ответ от модели
 */
async function callAgentRouter(prompt, options = {}) {
  const {
    model = 'claude-sonnet-4-5',
    maxTokens = 1024,
    temperature = 1.0
  } = options;

  console.log('\n📤 Отправка запроса в AgentRouter...');
  console.log(`   Модель: ${model}`);
  console.log(`   Запрос: ${prompt.substring(0, 50)}${prompt.length > 50 ? '...' : ''}`);

  const startTime = Date.now();

  try {
    // Отправляем запрос через AgentRouter
    const response = await anthropic.messages.create({
      model: model,
      max_tokens: maxTokens,
      temperature: temperature,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const duration = Date.now() - startTime;

    // Получаем текст ответа
    const responseText = response.content[0].text;

    // ВАЖНО: Записываем использование токенов
    if (response.usage) {
      tokenCounter.trackRequest({
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
        model: model,
        requestDescription: prompt.substring(0, 100)
      });
    }

    console.log(`\n✅ Ответ получен за ${duration}ms`);
    console.log(`   Длина ответа: ${responseText.length} символов`);

    return responseText;

  } catch (error) {
    console.error('\n❌ Ошибка при вызове AgentRouter API:');

    if (error.status) {
      console.error(`   HTTP Status: ${error.status}`);
    }

    if (error.message) {
      console.error(`   Сообщение: ${error.message}`);
    }

    // Обработка специфичных ошибок
    if (error.status === 401) {
      console.error('\n   💡 Проверьте правильность ANTHROPIC_API_KEY');
    } else if (error.status === 429) {
      console.error('\n   💡 Превышен лимит запросов. Подождите немного.');
    } else if (error.status === 500) {
      console.error('\n   💡 Ошибка сервера AgentRouter. Попробуйте позже.');
    }

    throw error;
  }
}

/**
 * Пакетная обработка нескольких запросов
 *
 * @param {Array<string>} prompts - Массив запросов
 * @param {Object} options - Параметры для всех запросов
 * @returns {Promise<Array<string>>} - Массив ответов
 */
async function batchProcess(prompts, options = {}) {
  console.log(`\n📦 Пакетная обработка ${prompts.length} запросов...`);

  const results = [];

  for (let i = 0; i < prompts.length; i++) {
    console.log(`\n[${i + 1}/${prompts.length}] Обработка запроса...`);

    try {
      const result = await callAgentRouter(prompts[i], options);
      results.push(result);

      // Небольшая пауза между запросами для избежания rate limiting
      if (i < prompts.length - 1) {
        console.log('   ⏳ Пауза 1 секунда...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`   ❌ Запрос ${i + 1} завершился с ошибкой`);
      results.push(null);
    }
  }

  const successCount = results.filter(r => r !== null).length;
  console.log(`\n✅ Завершено: ${successCount}/${prompts.length} успешных запросов`);

  return results;
}

/**
 * Показать финальную статистику с информацией о репозитории
 */
function displayFinalStats() {
  console.log('\n' + '='.repeat(60));
  console.log('🏁 ФИНАЛЬНАЯ СТАТИСТИКА');
  console.log('='.repeat(60));

  // Показать статистику сессии
  tokenCounter.displaySessionStats();

  // Показать топ-3 самых дорогих запросов
  const topExpensive = tokenCounter.getTopExpensiveRequests(3);
  if (topExpensive.length > 0) {
    console.log('\n🔝 ТОП-3 САМЫХ ДОРОГИХ ЗАПРОСОВ:\n');
    topExpensive.forEach((req, index) => {
      console.log(`${index + 1}. ${req.description || 'Без описания'}`);
      console.log(`   💰 Стоимость: $${req.totalCost.toFixed(6)}`);
      console.log(`   📊 Токены: ${req.totalTokens.toLocaleString()}`);
      console.log(`   🤖 Модель: ${req.model}\n`);
    });
  }

  // Информация о репозитории
  console.log('='.repeat(60));
  console.log('📚 РЕПОЗИТОРИЙ');
  console.log('='.repeat(60));
  console.log('🔗 GitHub: https://github.com/your-username/test-agentrouter');
  console.log('📖 Документация: README-TokenCounter.md');
  console.log('💾 История токенов: agentrouter-token-history.json');
  console.log('='.repeat(60) + '\n');
}

// Автоматическое сохранение статистики при завершении программы
process.on('exit', () => {
  console.log('\n💾 Сохранение статистики...');
  tokenCounter.saveHistory();
});

// Обработка Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Получен сигнал прерывания (Ctrl+C)');
  displayFinalStats();
  process.exit(0);
});

// Обработка необработанных ошибок
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Необработанная ошибка:', error.message);
  displayFinalStats();
  process.exit(1);
});

/**
 * Основная функция с примерами использования
 */
async function main() {
  try {
    console.log('📋 Начинаем тестирование AgentRouter интеграции...\n');

    // ============================================================
    // ПРИМЕР 1: Простой запрос
    // ============================================================
    console.log('\n' + '='.repeat(60));
    console.log('📝 ПРИМЕР 1: Простой запрос');
    console.log('='.repeat(60));

    const response1 = await callAgentRouter(
      'Напиши короткую функцию на JavaScript для сортировки массива чисел',
      { model: 'claude-sonnet-4-5' }
    );

    console.log('\n📄 Ответ:');
    console.log(response1.substring(0, 200) + '...');

    // ============================================================
    // ПРИМЕР 2: Запрос с разными параметрами
    // ============================================================
    console.log('\n\n' + '='.repeat(60));
    console.log('📝 ПРИМЕР 2: Запрос с температурой 0.5');
    console.log('='.repeat(60));

    const response2 = await callAgentRouter(
      'Объясни что такое замыкания в JavaScript в 2-3 предложениях',
      {
        model: 'claude-sonnet-4-5',
        temperature: 0.5,
        maxTokens: 500
      }
    );

    console.log('\n📄 Ответ:');
    console.log(response2);

    // ============================================================
    // ПРИМЕР 3: Пакетная обработка
    // ============================================================
    console.log('\n\n' + '='.repeat(60));
    console.log('📝 ПРИМЕР 3: Пакетная обработка запросов');
    console.log('='.repeat(60));

    const prompts = [
      'Что такое async/await в JavaScript? Ответь кратко.',
      'Как работает Promise в JavaScript? Ответь кратко.',
      'Что такое event loop? Ответь кратко.'
    ];

    const batchResults = await batchProcess(prompts, {
      model: 'claude-sonnet-4-5',
      maxTokens: 300
    });

    console.log('\n📊 Результаты пакетной обработки:');
    batchResults.forEach((result, index) => {
      if (result) {
        console.log(`\n${index + 1}. ${prompts[index]}`);
        console.log(`   ✅ ${result.substring(0, 100)}...`);
      }
    });

    // ============================================================
    // ФИНАЛЬНАЯ СТАТИСТИКА
    // ============================================================
    displayFinalStats();

  } catch (error) {
    console.error('\n❌ Критическая ошибка в main():', error.message);
    displayFinalStats();
    process.exit(1);
  }
}

// ============================================================
// ЭКСПОРТ ДЛЯ ИСПОЛЬЗОВАНИЯ КАК МОДУЛЯ
// ============================================================
module.exports = {
  callAgentRouter,
  batchProcess,
  tokenCounter
};

// ============================================================
// ЗАПУСК, ЕСЛИ ФАЙЛ ВЫПОЛНЯЕТСЯ НАПРЯМУЮ
// ============================================================
if (require.main === module) {
  console.log('🎬 Запуск примеров использования...\n');

  main().then(() => {
    console.log('✅ Все примеры выполнены успешно!');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Ошибка выполнения:', error.message);
    process.exit(1);
  });
}
