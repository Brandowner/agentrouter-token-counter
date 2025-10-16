const fs = require('fs');
const path = require('path');

/**
 * TokenCounter - Класс для подсчета токенов API и отслеживания стоимости
 *
 * Основные возможности:
 * - Подсчет входящих и исходящих токенов
 * - Расчет стоимости по моделям
 * - Сохранение истории использования
 * - Статистика по сессиям и запросам
 */
class TokenCounter {
  constructor(options = {}) {
    // Путь к файлу для сохранения истории
    this.historyFile = options.historyFile || path.join(__dirname, 'token-usage-history.json');

    // Текущая сессия
    this.sessionId = Date.now().toString();
    this.sessionStart = new Date();

    // Счетчики для текущей сессии
    this.sessionStats = {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      requestCount: 0,
      requests: []
    };

    // Цены на токены для разных моделей (в долларах за 1000 токенов)
    this.pricing = options.pricing || {
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'claude-3-opus': { input: 0.015, output: 0.075 },
      'claude-3-sonnet': { input: 0.003, output: 0.015 },
      'claude-3-haiku': { input: 0.00025, output: 0.00125 },
      'claude-sonnet-4-5': { input: 0.003, output: 0.015 },
      'default': { input: 0.001, output: 0.002 }
    };

    // Загрузить историю если файл существует
    this.loadHistory();
  }

  /**
   * Записать использование токенов для одного запроса
   * @param {Object} usage - Объект с данными использования
   * @param {number} usage.inputTokens - Количество входящих токенов
   * @param {number} usage.outputTokens - Количество исходящих токенов
   * @param {string} usage.model - Название модели
   * @param {string} usage.requestDescription - Описание запроса (опционально)
   */
  trackRequest(usage) {
    const { inputTokens, outputTokens, model = 'default', requestDescription = '' } = usage;

    // Получить цены для модели
    const modelPricing = this.pricing[model] || this.pricing['default'];

    // Рассчитать стоимость (цена за 1000 токенов)
    const inputCost = (inputTokens / 1000) * modelPricing.input;
    const outputCost = (outputTokens / 1000) * modelPricing.output;
    const totalCost = inputCost + outputCost;

    // Создать запись о запросе
    const requestRecord = {
      timestamp: new Date().toISOString(),
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      inputCost: parseFloat(inputCost.toFixed(6)),
      outputCost: parseFloat(outputCost.toFixed(6)),
      totalCost: parseFloat(totalCost.toFixed(6)),
      description: requestDescription
    };

    // Обновить статистику сессии
    this.sessionStats.totalInputTokens += inputTokens;
    this.sessionStats.totalOutputTokens += outputTokens;
    this.sessionStats.totalCost += totalCost;
    this.sessionStats.requestCount++;
    this.sessionStats.requests.push(requestRecord);

    // Вывести статистику в консоль
    this.displayRequestStats(requestRecord);

    return requestRecord;
  }

  /**
   * Показать статистику по запросу в консоли
   */
  displayRequestStats(record) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 СТАТИСТИКА ЗАПРОСА');
    console.log('='.repeat(60));
    console.log(`⏰ Время: ${new Date(record.timestamp).toLocaleString('ru-RU')}`);
    console.log(`🤖 Модель: ${record.model}`);
    if (record.description) {
      console.log(`📝 Описание: ${record.description}`);
    }
    console.log(`\n📥 Входящие токены: ${record.inputTokens.toLocaleString()}`);
    console.log(`📤 Исходящие токены: ${record.outputTokens.toLocaleString()}`);
    console.log(`📊 Всего токенов: ${record.totalTokens.toLocaleString()}`);
    console.log(`\n💰 Стоимость входящих: $${record.inputCost.toFixed(6)}`);
    console.log(`💰 Стоимость исходящих: $${record.outputCost.toFixed(6)}`);
    console.log(`💵 Общая стоимость: $${record.totalCost.toFixed(6)}`);
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Показать статистику текущей сессии
   */
  displaySessionStats() {
    const duration = (Date.now() - new Date(this.sessionStart).getTime()) / 1000 / 60; // в минутах

    console.log('\n' + '='.repeat(60));
    console.log('📈 СТАТИСТИКА СЕССИИ');
    console.log('='.repeat(60));
    console.log(`🆔 ID сессии: ${this.sessionId}`);
    console.log(`⏰ Начало: ${this.sessionStart.toLocaleString('ru-RU')}`);
    console.log(`⏱️  Длительность: ${duration.toFixed(2)} минут`);
    console.log(`\n📊 Запросов выполнено: ${this.sessionStats.requestCount}`);
    console.log(`📥 Всего входящих токенов: ${this.sessionStats.totalInputTokens.toLocaleString()}`);
    console.log(`📤 Всего исходящих токенов: ${this.sessionStats.totalOutputTokens.toLocaleString()}`);
    console.log(`📊 Всего токенов: ${(this.sessionStats.totalInputTokens + this.sessionStats.totalOutputTokens).toLocaleString()}`);
    console.log(`\n💵 Общая стоимость сессии: $${this.sessionStats.totalCost.toFixed(6)}`);

    if (this.sessionStats.requestCount > 0) {
      const avgCost = this.sessionStats.totalCost / this.sessionStats.requestCount;
      const avgTokens = (this.sessionStats.totalInputTokens + this.sessionStats.totalOutputTokens) / this.sessionStats.requestCount;
      console.log(`📊 Средняя стоимость запроса: $${avgCost.toFixed(6)}`);
      console.log(`📊 Среднее количество токенов: ${avgTokens.toFixed(0)}`);
    }
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Получить топ самых дорогих запросов
   */
  getTopExpensiveRequests(limit = 5) {
    return [...this.sessionStats.requests]
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, limit);
  }

  /**
   * Сохранить историю в JSON файл
   */
  saveHistory() {
    try {
      let history = [];

      // Загрузить существующую историю
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf8');
        history = JSON.parse(data);
      }

      // Добавить текущую сессию
      history.push({
        sessionId: this.sessionId,
        sessionStart: this.sessionStart.toISOString(),
        sessionEnd: new Date().toISOString(),
        stats: {
          totalInputTokens: this.sessionStats.totalInputTokens,
          totalOutputTokens: this.sessionStats.totalOutputTokens,
          totalTokens: this.sessionStats.totalInputTokens + this.sessionStats.totalOutputTokens,
          totalCost: parseFloat(this.sessionStats.totalCost.toFixed(6)),
          requestCount: this.sessionStats.requestCount
        },
        requests: this.sessionStats.requests
      });

      // Сохранить обновленную историю
      fs.writeFileSync(this.historyFile, JSON.stringify(history, null, 2), 'utf8');
      console.log(`✅ История сохранена в ${this.historyFile}`);

      return true;
    } catch (error) {
      console.error('❌ Ошибка при сохранении истории:', error.message);
      return false;
    }
  }

  /**
   * Загрузить историю из JSON файла
   */
  loadHistory() {
    try {
      if (fs.existsSync(this.historyFile)) {
        const data = fs.readFileSync(this.historyFile, 'utf8');
        this.history = JSON.parse(data);
        console.log(`✅ Загружено ${this.history.length} сессий из истории`);
      } else {
        this.history = [];
      }
    } catch (error) {
      console.error('❌ Ошибка при загрузке истории:', error.message);
      this.history = [];
    }
  }

  /**
   * Получить общую статистику за все время
   */
  getTotalStats() {
    if (!this.history || this.history.length === 0) {
      return null;
    }

    const total = this.history.reduce((acc, session) => {
      acc.totalInputTokens += session.stats.totalInputTokens || 0;
      acc.totalOutputTokens += session.stats.totalOutputTokens || 0;
      acc.totalTokens += session.stats.totalTokens || 0;
      acc.totalCost += session.stats.totalCost || 0;
      acc.requestCount += session.stats.requestCount || 0;
      return acc;
    }, {
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalTokens: 0,
      totalCost: 0,
      requestCount: 0,
      sessionCount: this.history.length
    });

    return total;
  }

  /**
   * Показать общую статистику за все время
   */
  displayTotalStats() {
    const stats = this.getTotalStats();

    if (!stats) {
      console.log('📊 Нет данных за предыдущие сессии');
      return;
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 ОБЩАЯ СТАТИСТИКА ЗА ВСЕ ВРЕМЯ');
    console.log('='.repeat(60));
    console.log(`🔢 Всего сессий: ${stats.sessionCount}`);
    console.log(`📊 Всего запросов: ${stats.requestCount}`);
    console.log(`📥 Всего входящих токенов: ${stats.totalInputTokens.toLocaleString()}`);
    console.log(`📤 Всего исходящих токенов: ${stats.totalOutputTokens.toLocaleString()}`);
    console.log(`📊 Всего токенов: ${stats.totalTokens.toLocaleString()}`);
    console.log(`💵 Общая стоимость: $${stats.totalCost.toFixed(6)}`);

    if (stats.requestCount > 0) {
      console.log(`📊 Средняя стоимость запроса: $${(stats.totalCost / stats.requestCount).toFixed(6)}`);
    }
    console.log('='.repeat(60) + '\n');
  }

  /**
   * Завершить сессию и сохранить данные
   */
  endSession() {
    this.displaySessionStats();
    this.saveHistory();
    this.displayTotalStats();
  }
}

module.exports = TokenCounter;
