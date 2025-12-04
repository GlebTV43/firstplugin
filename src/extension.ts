import * as vscode from 'vscode';
import { TomodoroTimer } from './timer';

let tomodoroTimer: TomodoroTimer;

export function activate(context: vscode.ExtensionContext) {
    console.log('Tomodoro Timer activated!');

    // Создаем таймер
    tomodoroTimer = new TomodoroTimer();

    // Регистрируем команды
    const commands = [
        vscode.commands.registerCommand('tomodoro.start', () => {
            tomodoroTimer.start();
        }),
        vscode.commands.registerCommand('tomodoro.pause', () => {
            tomodoroTimer.pause();
        }),
        vscode.commands.registerCommand('tomodoro.reset', () => {
            tomodoroTimer.reset();
        }),
        vscode.commands.registerCommand('tomodoro.skip', () => {
            tomodoroTimer.skip();
        })
    ];

    // Добавляем команды в подписки
    commands.forEach(command => context.subscriptions.push(command));
    
    // Добавляем сам таймер в подписки для очистки
    context.subscriptions.push(tomodoroTimer);
}

export function deactivate() {
    if (tomodoroTimer) {
        tomodoroTimer.dispose();
    }
}