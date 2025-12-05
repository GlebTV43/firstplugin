import * as vscode from 'vscode';
import { TomodoroTimer } from './timer';

// Глобальная переменная для хранения экземпляра таймера
let tomodoroTimer: TomodoroTimer;

/**
 * Активирует расширение Tomodoro Timer.
 * Вызывается автоматически VS Code при запуске расширения.
 * Регистрирует все команды и инициализирует основные компоненты.
 * 
 * @param {vscode.ExtensionContext} context - Контекст расширения, предоставляемый VS Code.
 * Содержит:
 * - subscriptions: массив для регистрации disposable-объектов (команд, обработчиков событий и т.д.)
 * - extensionPath: путь к директории расширения
 * - storagePath: путь к хранилищу данных расширения
 * - globalState / workspaceState: хранилища состояний
 * - extensionUri: URI расширения
 * и другие свойства для управления жизненным циклом расширения.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Tomodoro Timer activated!');

    // Инициализация основного компонента - таймера Pomodoro
    tomodoroTimer = new TomodoroTimer();

    /**
     * Регистрация команды: Запуск таймера
     * Команда: tomodoro.start
     * Действие: Запускает таймер (томодоро или перерыв)
     * 
     * @param {string} commandId - Идентификатор команды ('tomodoro.start')
     * @param {Function} callback - Функция-обработчик команды (() => tomodoroTimer.start())
     * @returns {vscode.Disposable} Объект для отмены регистрации команды
     */
    const startCommand = vscode.commands.registerCommand('tomodoro.start', () => {
        tomodoroTimer.start();
    });

    /**
     * Регистрация команды: Пауза таймера
     * Команда: tomodoro.pause
     * Действие: Приостанавливает текущий таймер
     * 
     * @param {string} commandId - Идентификатор команды ('tomodoro.pause')
     * @param {Function} callback - Функция-обработчик команды (() => tomodoroTimer.pause())
     * @returns {vscode.Disposable} Объект для отмены регистрации команды
     */
    const pauseCommand = vscode.commands.registerCommand('tomodoro.pause', () => {
        tomodoroTimer.pause();
    });

    /**
     * Регистрация команды: Сброс таймера
     * Команда: tomodoro.reset
     * Действие: Сбрасывает таймер в начальное состояние
     * 
     * @param {string} commandId - Идентификатор команды ('tomodoro.reset')
     * @param {Function} callback - Функция-обработчик команды (() => tomodoroTimer.reset())
     * @returns {vscode.Disposable} Объект для отмены регистрации команды
     */
    const resetCommand = vscode.commands.registerCommand('tomodoro.reset', () => {
        tomodoroTimer.reset();
    });

    /**
     * Регистрация команды: Пропуск сессии
     * Команда: tomodoro.skip
     * Действие: Пропускает текущую сессию (томодоро → перерыв или наоборот)
     * 
     * @param {string} commandId - Идентификатор команды ('tomodoro.skip')
     * @param {Function} callback - Функция-обработчик команды (() => tomodoroTimer.skip())
     * @returns {vscode.Disposable} Объект для отмены регистрации команды
     */
    const skipCommand = vscode.commands.registerCommand('tomodoro.skip', () => {
        tomodoroTimer.skip();
    });

    // Добавление всех команд в контекст расширения для автоматической очистки
    // @param {...vscode.Disposable[]} disposables - Объекты для автоматического освобождения ресурсов
    context.subscriptions.push(startCommand, pauseCommand, resetCommand, skipCommand);
    
    // Добавление таймера в подписки для гарантированного вызова dispose()
    // @param {TomodoroTimer} tomodoroTimer - Экземпляр таймера, реализующий интерфейс Disposable
    context.subscriptions.push(tomodoroTimer);
}

/**
 * Деактивирует расширение Tomodoro Timer.
 * Вызывается автоматически VS Code перед выгрузкой расширения.
 * Освобождает все занятые ресурсы.
 * 
 * @returns {void} Функция не возвращает значения
 */
export function deactivate() {
    // Проверка существования экземпляра таймера перед очисткой
    if (tomodoroTimer) {
        tomodoroTimer.dispose();
    }
}