import * as vscode from 'vscode';

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

    constructor() {
        // Создаем статус бар
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100
        );
        this.statusBarItem.show();
        this.updateStatusBar();
        
        this.reset();
    }

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

    public reset(): void {
        this.pause();
        this.isWorkPhase = true;
        this.timeLeft = this.workTime;
        this.currentSession = 0;
        this.updateStatusBar();
        vscode.window.showInformationMessage('Timer reset to 50:00 work time');
    }

    public skip(): void {
        this.switchPhase();
        vscode.window.showInformationMessage(`Switched to ${this.isWorkPhase ? 'work' : 'break'} phase`);
    }

    private tick(): void {
        this.timeLeft--;

        if (this.timeLeft <= 0) {
            this.switchPhase();
        }

        this.updateStatusBar();
    }

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

    private formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    public dispose(): void {
        this.pause();
        this.statusBarItem.dispose();
    }
}