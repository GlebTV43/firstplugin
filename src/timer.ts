import * as vscode from 'vscode';

/**
 * Класс TomodoroTimer - основной класс таймера Pomodoro.
 * Реализует логику работы/перерыва, отображение в статус-баре и уведомления.
 * 
 * @implements {vscode.Disposable} - Интерфейс для освобождения ресурсов при деактивации расширения
 */
export class TomodoroTimer implements vscode.Disposable {
    // Приватные поля класса
    
    /**
     * Элемент статус-бара для отображения таймера в интерфейсе VS Code
     * @type {vscode.StatusBarItem}
     * @private
     */
    private statusBarItem: vscode.StatusBarItem;
    
    /**
     * Ссылка на таймер Node.js для управления интервалами
     * @type {NodeJS.Timeout | undefined}
     * @private
     */
    private timer: NodeJS.Timeout | undefined;
    
    /**
     * Настройки таймера
     * @private
     */
    
    /**
     * Продолжительность рабочей фазы в секундах
     * @type {number}
     * @default 3000 (50 минут * 60 секунд)
     * @private
     */
    private workTime: number = 50 * 60; // 50 минут в секундах
    
    /**
     * Продолжительность фазы перерыва в секундах
     * @type {number}
     * @default 600 (10 минут * 60 секунд)
     * @private
     */
    private breakTime: number = 10 * 60; // 10 минут в секундах
    
    /**
     * Оставшееся время текущей фазы в секундах
     * @type {number}
     * @private
     */
    private timeLeft: number = 0;
    
    /**
     * Флаг, указывающий на активность таймера
     * @type {boolean}
     * @private
     */
    private isRunning: boolean = false;
    
    /**
     * Флаг текущей фазы: true - рабочая фаза, false - фаза перерыва
     * @type {boolean}
     * @private
     */
    private isWorkPhase: boolean = true;
    
    /**
     * Счетчик завершенных рабочих сессий
     * @type {number}
     * @private
     */
    private currentSession: number = 0;

    /**
     * Конструктор класса TomodoroTimer.
     * Инициализирует статус-бар и сбрасывает таймер к начальному состоянию.
     * 
     * @returns {TomodoroTimer} - Экземпляр класса TomodoroTimer
     * 
     * @example
     * const timer = new TomodoroTimer();
     * 
     * Создает:
     * 1. Элемент статус-бара с выравниванием справа
     * 2. Инициализирует таймер начальными значениями
     */
    constructor() {
        /**
         * Создание элемента статус-бара
         * @param {vscode.StatusBarAlignment} alignment - Выравнивание (Right)
         * @param {number} priority - Приоритет отображения (100)
         * @returns {vscode.StatusBarItem} - Созданный элемент статус-бара
         */
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.show();
        this.updateStatusBar();
        
        // Инициализация таймера начальными значениями
        this.reset();
    }

    /**
     * Запускает таймер, если он не был запущен.
     * Создает интервал, который вызывает tick() каждую секунду.
     * Показывает информационное сообщение о запуске.
     * 
     * @returns {void} - Функция не возвращает значения
     * 
     * @example
     * timer.start(); // Запускает таймер с текущими настройками
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
     * 
     * @returns {void} - Функция не возвращает значения
     * 
     * @example
     * timer.pause(); // Приостанавливает текущий таймер
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
     * 
     * @returns {void} - Функция не возвращает значения
     * 
     * @example
     * timer.reset(); // Сбрасывает таймер к 50:00 рабочего времени
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
     * 
     * @returns {void} - Функция не возвращает значения
     * 
     * @example
     * timer.skip(); // Переключает с рабочей фазы на перерыв или наоборот
     */
    public skip(): void {
        this.switchPhase();
        vscode.window.showInformationMessage(`Switched to ${this.isWorkPhase ? 'work' : 'break'} phase`);
    }

    /**
     * Обработчик тика таймера (вызывается каждую секунду).
     * Уменьшает оставшееся время и проверяет окончание текущей фазы.
     * 
     * @returns {void} - Функция не возвращает значения
     * @private
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
     * 
     * @returns {void} - Функция не возвращает значения
     * @private
     */
    private switchPhase(): void {
        this.pause();

        if (this.isWorkPhase) {
            // Завершилась рабочая сессия
            this.isWorkPhase = false;
            this.timeLeft = this.breakTime;
            this.currentSession++;
            
            /**
             * Показывает уведомление о завершении работы
             * @param {string} message - Сообщение об окончании сессии
             * @param {string} button - Кнопка "Start Break"
             * @returns {Thenable<string | undefined>} Promise с выбором пользователя
             */
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
            
            /**
             * Показывает уведомление о завершении перерыва
             * @param {string} message - Сообщение об окончании перерыва
             * @param {string} button - Кнопка "Start Work"
             * @returns {Thenable<string | undefined>} Promise с выбором пользователя
             */
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
     * 
     * @returns {void} - Функция не возвращает значения
     * @private
     */
    private updateStatusBar(): void {
        const icon = this.isWorkPhase ? '🎯' : '☕';
        const phase = this.isWorkPhase ? 'WORK' : 'BREAK';
        const time = this.formatTime(this.timeLeft);
        const status = this.isRunning ? '$(play)' : '$(debug-pause)';

        this.statusBarItem.text = `${icon} ${phase}: ${time} ${status}`;
        this.statusBarItem.tooltip = `Tomodoro Timer | Session: ${this.currentSession} | Click to ${this.isRunning ? 'pause' : 'start'}`;
        
        /**
         * Установка цвета элемента статус-бара
         * @param {vscode.ThemeColor | string} color - Цвет элемента
         */
        this.statusBarItem.color = this.isWorkPhase 
            ? new vscode.ThemeColor('statusBar.foreground') 
            : '#FFA500';
        
        /**
         * Установка команды, выполняемой при клике на элемент
         * @param {string} command - Идентификатор команды VS Code
         */
        this.statusBarItem.command = this.isRunning ? 'tomodoro.pause' : 'tomodoro.start';
    }

    /**
     * Форматирует время из секунд в строку MM:SS.
     * 
     * @param {number} seconds - время в секундах для форматирования
     * @returns {string} отформатированная строка времени в формате "MM:SS"
     * @private
     * 
     * @example
     * this.formatTime(125); // Возвращает "02:05"
     * this.formatTime(3600); // Возвращает "60:00"
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
     * 
     * @returns {void} - Функция не возвращает значения
     * 
     * @implements vscode.Disposable.dispose
     * 
     * @example
     * timer.dispose(); // Очищает ресурсы таймера
     */
    public dispose(): void {
        this.pause();
        this.statusBarItem.dispose();
    }
}