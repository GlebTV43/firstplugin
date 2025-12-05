import * as vscode from 'vscode';
import { TomodoroTimer } from './timer';

// Глобальная переменная для хранения экземпляра таймера
let tomodoroTimer: TomodoroTimer;

/**
 * Активирует расширение Tomodoro Timer.
 * Вызывается автоматически VS Code при запуске расширения.
 * Регистрирует все команды и инициализирует основные компоненты.
 */
export function activate(context: vscode.ExtensionContext) {
    console.log('Tomodoro Timer activated!');

    // Инициализация основного компонента - таймера Pomodoro
    tomodoroTimer = new TomodoroTimer();

    /**
     * Регистрация команды: Запуск таймера
     * Команда: tomodoro.start
     * Действие: Запускает таймер (томодоро или перерыв)
     */
    const startCommand = vscode.commands.registerCommand('tomodoro.start', () => {
        tomodoroTimer.start();
    });

    /**
     * Регистрация команды: Пауза таймера
     * Команда: tomodoro.pause
     * Действие: Приостанавливает текущий таймер
     */
    const pauseCommand = vscode.commands.registerCommand('tomodoro.pause', () => {
        tomodoroTimer.pause();
    });

    /**
     * Регистрация команды: Сброс таймера
     * Команда: tomodoro.reset
     * Действие: Сбрасывает таймер в начальное состояние
     */
    const resetCommand = vscode.commands.registerCommand('tomodoro.reset', () => {
        tomodoroTimer.reset();
    });

    /**
     * Регистрация команды: Пропуск сессии
     * Команда: tomodoro.skip
     * Действие: Пропускает текущую сессию (томодоро → перерыв или наоборот)
     */
    const skipCommand = vscode.commands.registerCommand('tomodoro.skip', () => {
        tomodoroTimer.skip();
    });

    // Добавление всех команд в контекст расширения для автоматической очистки
    context.subscriptions.push(startCommand, pauseCommand, resetCommand, skipCommand);
    
    // Добавление таймера в подписки для гарантированного вызова dispose()
    context.subscriptions.push(tomodoroTimer);
}

/**
 * Деактивирует расширение Tomodoro Timer.
 * Вызывается автоматически VS Code перед выгрузкой расширения.
 * Освобождает все занятые ресурсы.
 */
export function deactivate() {
    if (tomodoroTimer) {
        tomodoroTimer.dispose();
    }
}