# 📊 Token Counter - Счетчик токенов API

Инструмент для отслеживания использования токенов при работе с различными API (OpenAI, Anthropic, и другими).

## 🎯 Возможности

- ✅ Подсчет входящих (input) и исходящих (output) токенов
- 💰 Автоматический расчет стоимости в долларах
- 📈 Статистика по каждому запросу
- 💾 Сохранение истории использования в JSON
- 📊 Статистика текущей сессии и за все время
- 🔝 Определение самых дорогих запросов
- 🎨 Красивый вывод статистики в консоль

## 📦 Установка

Файл не требует установки дополнительных пакетов - использует только встроенные модули Node.js (`fs`, `path`).

```bash
# Просто скопируйте файлы в ваш проект
cp token-counter.js /путь/к/вашему/проекту/
```

## 🚀 Быстрый старт

### Базовое использование

```javascript
const TokenCounter = require('./token-counter');

// Создать экземпляр счетчика
const counter = new TokenCounter();

// Записать использование токенов
counter.trackRequest({
  inputTokens: 150,
  outputTokens: 300,
  model: 'gpt-4',
  requestDescription: 'Генерация кода'
});

// Показать статистику сессии
counter.displaySessionStats();

// Сохранить историю
counter.saveHistory();
```

### Запуск примера

```bash
node example-usage.js
```

## 📖 Подробное описание

### Конструктор

```javascript
const counter = new TokenCounter(options);
```

**Параметры:**
- `options.historyFile` (string) - путь к файлу для сохранения истории (по умолчанию: `./token-usage-history.json`)
- `options.pricing` (object) - пользовательские цены для моделей

**Пример с опциями:**

```javascript
const counter = new TokenCounter({
  historyFile: './my-custom-history.json',
  pricing: {
    'my-model': { input: 0.005, output: 0.010 }
  }
});
```

### Основные методы

#### `trackRequest(usage)`

Записывает использование токенов для одного запроса и выводит статистику.

**Параметры:**
```javascript
{
  inputTokens: number,      // Количество входящих токенов (обязательно)
  outputTokens: number,     // Количество исходящих токенов (обязательно)
  model: string,            // Название модели (необязательно, по умолчанию 'default')
  requestDescription: string // Описание запроса (необязательно)
}
```

**Пример:**
```javascript
counter.trackRequest({
  inputTokens: 200,
  outputTokens: 450,
  model: 'claude-sonnet-4-5',
  requestDescription: 'Рефакторинг кода'
});
```

#### `displaySessionStats()`

Показывает статистику текущей сессии в консоли.

**Выводит:**
- ID сессии
- Время начала и длительность
- Количество запросов
- Общее количество токенов (входящих/исходящих)
- Общую стоимость
- Средние показатели

**Пример:**
```javascript
counter.displaySessionStats();
```

#### `saveHistory()`

Сохраняет историю текущей сессии в JSON файл.

**Пример:**
```javascript
counter.saveHistory();
```

#### `displayTotalStats()`

Показывает общую статистику за все сессии (загружает из файла истории).

**Пример:**
```javascript
counter.displayTotalStats();
```

#### `endSession()`

Завершает сессию: показывает статистику, сохраняет историю, показывает общую статистику.

**Пример:**
```javascript
counter.endSession();
```

#### `getTopExpensiveRequests(limit)`

Возвращает массив самых дорогих запросов.

**Параметры:**
- `limit` (number) - количество запросов для возврата (по умолчанию: 5)

**Пример:**
```javascript
const top5 = counter.getTopExpensiveRequests(5);
console.log(top5);
```

## 💰 Цены на модели

Встроенные цены (в долларах за 1000 токенов):

| Модель | Входящие токены | Исходящие токены |
|--------|----------------|------------------|
| gpt-4 | $0.03 | $0.06 |
| gpt-4-turbo | $0.01 | $0.03 |
| gpt-3.5-turbo | $0.0005 | $0.0015 |
| claude-3-opus | $0.015 | $0.075 |
| claude-3-sonnet | $0.003 | $0.015 |
| claude-3-haiku | $0.00025 | $0.00125 |
| claude-sonnet-4-5 | $0.003 | $0.015 |
| default | $0.001 | $0.002 |

Вы можете переопределить цены при создании экземпляра:

```javascript
const counter = new TokenCounter({
  pricing: {
    'my-custom-model': { input: 0.005, output: 0.010 }
  }
});
```

## 📊 Формат данных

### Запись о запросе

```javascript
{
  timestamp: "2025-10-17T10:30:00.000Z",
  model: "gpt-4",
  inputTokens: 150,
  outputTokens: 300,
  totalTokens: 450,
  inputCost: 0.0045,
  outputCost: 0.018,
  totalCost: 0.0225,
  description: "Генерация кода"
}
```

### Формат файла истории

```json
[
  {
    "sessionId": "1697534400000",
    "sessionStart": "2025-10-17T10:00:00.000Z",
    "sessionEnd": "2025-10-17T10:45:00.000Z",
    "stats": {
      "totalInputTokens": 1500,
      "totalOutputTokens": 3000,
      "totalTokens": 4500,
      "totalCost": 0.225,
      "requestCount": 10
    },
    "requests": [...]
  }
]
```

## 🎯 Примеры использования

### Пример 1: Интеграция с OpenAI API

```javascript
const TokenCounter = require('./token-counter');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const counter = new TokenCounter();

async function chat(prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }]
  });

  // Записываем использование токенов
  counter.trackRequest({
    inputTokens: response.usage.prompt_tokens,
    outputTokens: response.usage.completion_tokens,
    model: 'gpt-4',
    requestDescription: prompt.substring(0, 50)
  });

  return response.choices[0].message.content;
}

// Использование
(async () => {
  await chat('Напиши функцию сортировки массива');
  await chat('Объясни что такое замыкания в JavaScript');

  counter.endSession();
})();
```

### Пример 2: Интеграция с Anthropic API

```javascript
const TokenCounter = require('./token-counter');
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const counter = new TokenCounter();

async function chat(prompt) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }]
  });

  // Записываем использование токенов
  counter.trackRequest({
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    model: 'claude-sonnet-4-5',
    requestDescription: prompt.substring(0, 50)
  });

  return response.content[0].text;
}

// Использование
(async () => {
  await chat('Помоги мне с рефакторингом кода');
  counter.endSession();
})();
```

### Пример 3: Автосохранение при выходе

```javascript
const TokenCounter = require('./token-counter');
const counter = new TokenCounter();

// Автоматическое сохранение при завершении программы
process.on('exit', () => {
  counter.saveHistory();
});

// Обработка Ctrl+C
process.on('SIGINT', () => {
  console.log('\nСохранение статистики...');
  counter.endSession();
  process.exit(0);
});

// Ваш код здесь
counter.trackRequest({
  inputTokens: 100,
  outputTokens: 200,
  model: 'gpt-4'
});
```

### Пример 4: Мониторинг бюджета

```javascript
const TokenCounter = require('./token-counter');
const counter = new TokenCounter();

// Установить лимит бюджета
const BUDGET_LIMIT = 10.00; // $10

function checkBudget() {
  const stats = counter.getTotalStats();
  if (stats && stats.totalCost >= BUDGET_LIMIT) {
    console.warn(`⚠️  ВНИМАНИЕ: Превышен бюджет! Потрачено: $${stats.totalCost.toFixed(2)}`);
    return false;
  }
  return true;
}

// Перед каждым запросом проверяем бюджет
if (checkBudget()) {
  counter.trackRequest({
    inputTokens: 150,
    outputTokens: 300,
    model: 'gpt-4'
  });
}

counter.displayTotalStats();
```

## 🔧 Дополнительные возможности

### Получение сырых данных

```javascript
// Получить все запросы текущей сессии
const requests = counter.sessionStats.requests;

// Получить топ-10 самых дорогих запросов
const expensive = counter.getTopExpensiveRequests(10);

// Получить общую статистику
const totalStats = counter.getTotalStats();
```

### Фильтрация и анализ

```javascript
// Найти все запросы к определенной модели
const gpt4Requests = counter.sessionStats.requests.filter(
  req => req.model === 'gpt-4'
);

// Подсчитать стоимость по модели
const gpt4Cost = gpt4Requests.reduce(
  (sum, req) => sum + req.totalCost, 0
);

console.log(`Потрачено на GPT-4: $${gpt4Cost.toFixed(6)}`);
```

## 📝 Примечания

1. **Безопасность**: Этот инструмент НЕ перехватывает API запросы. Вы должны вручную вызывать `trackRequest()` после каждого запроса к API.

2. **Точность**: Цены на модели могут меняться. Проверяйте актуальные цены на официальных сайтах:
   - OpenAI: https://openai.com/pricing
   - Anthropic: https://www.anthropic.com/pricing

3. **Хранение данных**: История сохраняется в JSON файл локально. Файл может расти со временем.

4. **Многопоточность**: Класс не является потокобезопасным. Используйте отдельные экземпляры для параллельных процессов.

## 🤝 Вклад в проект

Если вы хотите добавить поддержку других моделей или улучшить функциональность, просто отредактируйте файл `token-counter.js`.

## 📄 Лицензия

Свободное использование.

## ❓ Вопросы и поддержка

Если у вас возникли вопросы или проблемы, проверьте файл `example-usage.js` для дополнительных примеров использования.
