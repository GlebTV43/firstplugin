import * as vscode from 'vscode';

/**
 * Класс TomodoroTimer - основной класс таймера Pomodoro.
 * Реализует логику работы/перерыва, отображение в статус-баре и уведомления.
 */
export class TomodoroTimer implements vscode.Disposable {
    private statusBarItem: vscode.StatusBarItem;
    private timer: NodeJS.Timeout | undefined;
    
    // Настройки таймера
    private workTime: number = 50 * 60; // 50 минут в секундах
    private breakTime: number = 10 * 60; // 10 минут в секундах
    
    private timeLeft: number = 0;
    private isRunning: boolean = false;
    private isWorkPhase: boolean = true;
    private currentSession: number = 0;

    /**
     * Конструктор класса TomodoroTimer.
     * Инициализирует статус-бар и сбрасывает таймер к начальному состоянию.
     */
    constructor() {
        // Создаем элемент статус-бара с выравниванием справа
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.show();
        this.updateStatusBar();
        
        this.reset();
    }

    /**
     * Запускает таймер, если он не был запущен.
     * Создает интервал, который вызывает tick() каждую секунду.
     * Показывает информационное сообщение о запуске.
     */
    public start(): void {
        if (this.isRunning) {
            vscode.window.showInformationMessage('Timer is already running!');
            return;
        }

        this.isRunning = true;
        this.timer = setInterval(() => {
            this.tick();
        }, 1000);

        vscode.window.showInformationMessage(
            `Tomodoro started! ${this.isWorkPhase ? 'Work' : 'Break'} time: ${this.formatTime(this.timeLeft)}`
        );
    }

    /**
     * Приостанавливает работу таймера.
     * Останавливает интервал и показывает информационное сообщение.
     */
    public pause(): void {
        if (!this.isRunning) {
            vscode.window.showInformationMessage('Timer is not running!');
            return;
        }

        this.isRunning = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = undefined;
        }

        vscode.window.showInformationMessage('Timer paused');
    }

    /**
     * Сбрасывает таймер к начальным настройкам.
     * Останавливает таймер, устанавливает рабочую фазу и начальное время.
     */
    public reset(): void {
        this.pause();
        this.isWorkPhase = true;
        this.timeLeft = this.workTime;
        this.currentSession = 0;
        this.updateStatusBar();
        vscode.window.showInformationMessage('Timer reset to 50:00 work time');
    }

    /**
     * Пропускает текущую фазу (работа/перерыв) и переключает на следующую.
     * Вызывает switchPhase() и показывает информационное сообщение.
     */
    public skip(): void {
        this.switchPhase();
        vscode.window.showInformationMessage(`Switched to ${this.isWorkPhase ? 'work' : 'break'} phase`);
    }

    /**
     * Обработчик тика таймера (вызывается каждую секунду).
     * Уменьшает оставшееся время и проверяет окончание текущей фазы.
     */
    private tick(): void {
        this.timeLeft--;

        if (this.timeLeft <= 0) {
            this.switchPhase();
        }

        this.updateStatusBar();
    }

    /**
     * Переключает между рабочей фазой и перерывом.
     * Останавливает таймер, меняет фазу, показывает уведомление с предложением начать следующую фазу.
     */
    private switchPhase(): void {
        this.pause();

        if (this.isWorkPhase) {
            // Завершилась рабочая сессия
            this.isWorkPhase = false;
            this.timeLeft = this.breakTime;
            this.currentSession++;
            
            vscode.window.showInformationMessage(
                `🎉 Work session ${this.currentSession} completed! Time for a 10-minute break.`,
                'Start Break'
            ).then(selection => {
                if (selection === 'Start Break') {
                    this.start();
                }
            });
        } else {
            // Завершился перерыв
            this.isWorkPhase = true;
            this.timeLeft = this.workTime;
            
            vscode.window.showInformationMessage(
                `⚡ Break finished! Ready for work session ${this.currentSession + 1}?`,
                'Start Work'
            ).then(selection => {
                if (selection === 'Start Work') {
                    this.start();
                }
            });
        }

        this.updateStatusBar();
    }

    /**
     * Обновляет отображение таймера в статус-баре.
     * Устанавливает текст, иконку, цвет и всплывающую подсказку.
     * Назначает команду при клике (пауза/запуск).
     */
    private updateStatusBar(): void {
        const icon = this.isWorkPhase ? '🎯' : '☕';
        const phase = this.isWorkPhase ? 'WORK' : 'BREAK';
        const time = this.formatTime(this.timeLeft);
        const status = this.isRunning ? '$(play)' : '$(debug-pause)';

        this.statusBarItem.text = `${icon} ${phase}: ${time} ${status}`;
        this.statusBarItem.tooltip = `Tomodoro Timer | Session: ${this.currentSession} | Click to ${this.isRunning ? 'pause' : 'start'}`;
        
        // Меняем цвет в зависимости от фазы
        this.statusBarItem.color = this.isWorkPhase ? new vscode.ThemeColor('statusBar.foreground') : '#FFA500';
        
        // Команда при клике
        this.statusBarItem.command = this.isRunning ? 'tomodoro.pause' : 'tomodoro.start';
    }

    /**
     * Форматирует время из секунд в строку MM:SS.
     * @param seconds - время в секундах
     * @returns отформатированная строка времени
     */
    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Освобождает ресурсы, занятые таймером.
     * Вызывается при деактивации расширения.
     * Останавливает таймер и удаляет элемент статус-бара.
     */
    public dispose(): void {
        this.pause();
        this.statusBarItem.dispose();
    }
}