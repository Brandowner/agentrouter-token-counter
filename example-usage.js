const TokenCounter = require('./token-counter');

/**
 * ПРИМЕР ИСПОЛЬЗОВАНИЯ TOKEN COUNTER
 *
 * Этот файл показывает различные способы использования TokenCounter
 * для отслеживания использования токенов API
 */

// ============================================================
// ПРИМЕР 1: Базовое использование
// ============================================================
console.log('=== ПРИМЕР 1: Базовое использование ===\n');

const counter = new TokenCounter();

// Симулируем запрос к API
counter.trackRequest({
  inputTokens: 150,
  outputTokens: 300,
  model: 'gpt-4',
  requestDescription: 'Генерация кода для веб-приложения'
});

// ============================================================
// ПРИМЕР 2: Отслеживание нескольких запросов
// ============================================================
console.log('\n=== ПРИМЕР 2: Несколько запросов ===\n');

// Запрос 1
counter.trackRequest({
  inputTokens: 200,
  outputTokens: 450,
  model: 'claude-sonnet-4-5',
  requestDescription: 'Рефакторинг существующего кода'
});

// Запрос 2
counter.trackRequest({
  inputTokens: 100,
  outputTokens: 250,
  model: 'gpt-3.5-turbo',
  requestDescription: 'Быстрый вопрос о синтаксисе'
});

// Запрос 3
counter.trackRequest({
  inputTokens: 500,
  outputTokens: 800,
  model: 'claude-3-opus',
  requestDescription: 'Сложный анализ архитектуры'
});

// ============================================================
// ПРИМЕР 3: Просмотр статистики сессии
// ============================================================
console.log('\n=== ПРИМЕР 3: Статистика сессии ===\n');

// Показать текущую статистику
counter.displaySessionStats();

// ============================================================
// ПРИМЕР 4: Топ самых дорогих запросов
// ============================================================
console.log('\n=== ПРИМЕР 4: Самые дорогие запросы ===\n');

const topExpensive = counter.getTopExpensiveRequests(3);
console.log('🔝 ТОП-3 самых дорогих запросов:\n');

topExpensive.forEach((req, index) => {
  console.log(`${index + 1}. ${req.description || 'Без описания'}`);
  console.log(`   Модель: ${req.model}`);
  console.log(`   Токены: ${req.totalTokens.toLocaleString()}`);
  console.log(`   Стоимость: $${req.totalCost.toFixed(6)}\n`);
});

// ============================================================
// ПРИМЕР 5: Завершение сессии и сохранение истории
// ============================================================
console.log('\n=== ПРИМЕР 5: Завершение сессии ===\n');

// Это покажет статистику сессии, сохранит историю и покажет общую статистику
counter.endSession();

// ============================================================
// ПРИМЕР 6: Использование с пользовательскими ценами
// ============================================================
console.log('\n\n=== ПРИМЕР 6: Пользовательские цены ===\n');

const customCounter = new TokenCounter({
  historyFile: './custom-token-history.json',
  pricing: {
    'my-custom-model': { input: 0.005, output: 0.010 },
    'another-model': { input: 0.002, output: 0.008 }
  }
});

customCounter.trackRequest({
  inputTokens: 300,
  outputTokens: 600,
  model: 'my-custom-model',
  requestDescription: 'Использование пользовательской модели'
});

customCounter.displaySessionStats();

// ============================================================
// ПРИМЕР 7: Интеграция с реальным API (псевдокод)
// ============================================================
console.log('\n\n=== ПРИМЕР 7: Интеграция с API (псевдокод) ===\n');

// Пример как интегрировать с реальным API вызовом
async function makeAPICallWithTracking(prompt, model = 'gpt-4') {
  const apiCounter = new TokenCounter();

  try {
    // Здесь был бы ваш реальный API вызов
    // const response = await fetch('https://api.openai.com/v1/chat/completions', {...});
    // const data = await response.json();

    // Симулируем ответ API
    const mockResponse = {
      usage: {
        prompt_tokens: 250,
        completion_tokens: 500,
        total_tokens: 750
      },
      choices: [{
        message: {
          content: 'Это был бы ответ от API...'
        }
      }]
    };

    // Записываем использование токенов
    apiCounter.trackRequest({
      inputTokens: mockResponse.usage.prompt_tokens,
      outputTokens: mockResponse.usage.completion_tokens,
      model: model,
      requestDescription: prompt
    });

    return mockResponse.choices[0].message.content;
  } catch (error) {
    console.error('Ошибка при вызове API:', error);
    throw error;
  } finally {
    // Сохраняем статистику в конце
    apiCounter.endSession();
  }
}

// Использование функции
console.log('Пример интеграции с API:');
console.log('const result = await makeAPICallWithTracking("Напиши функцию сортировки", "gpt-4");');

// ============================================================
// ПРИМЕР 8: Автоматический подсчет при завершении процесса
// ============================================================
console.log('\n\n=== ПРИМЕР 8: Автосохранение при выходе ===\n');

// Создаем глобальный счетчик
const globalCounter = new TokenCounter();

// Автоматически сохранять при выходе из программы
process.on('exit', () => {
  console.log('\n🔚 Программа завершается, сохраняем статистику...\n');
  globalCounter.saveHistory();
});

// Обработка Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Получен сигнал прерывания...\n');
  globalCounter.endSession();
  process.exit(0);
});

console.log('✅ Настроено автоматическое сохранение при выходе');
console.log('   Нажмите Ctrl+C для завершения программы\n');

// Симулируем несколько запросов
globalCounter.trackRequest({
  inputTokens: 180,
  outputTokens: 320,
  model: 'gpt-4-turbo',
  requestDescription: 'Тестовый запрос с автосохранением'
});
