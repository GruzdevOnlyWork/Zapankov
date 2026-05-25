import { Component, signal, computed, inject, effect } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [],
  template: `
    <header class="page-header">
      <div>
        <h1>Формирование отчёта</h1>
        <p class="page-subtitle">Выберите тип отчёта и настройте параметры</p>
      </div>
    </header>

    <div class="reports-grid">
      @for (report of reportTypes; track report.key) {
        <div
          class="report-card"
          [class.selected]="selectedReport() === report.key"
          (click)="selectReport(report.key)"
        >
          <svg class="report-card-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" [innerHTML]="report.iconPath"></svg>
          <h3>{{ report.title }}</h3>
          <p>{{ report.description }}</p>
          <div class="report-card-check">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
        </div>
      }
    </div>

    <div class="report-settings">
      <div class="settings-title">Параметры отчёта</div>

      <div class="settings-row">
        <div class="form-group">
          <label class="form-label">Период</label>
          <select class="form-select" [value]="period()" (change)="onPeriodChange(asValue($event))">
            <option value="current_month">Текущий месяц</option>
            <option value="last_month">Прошлый месяц</option>
            <option value="current_quarter">Текущий квартал</option>
            <option value="current_year">Текущий год</option>
            <option value="all_time">Всё время</option>
            <option value="custom">Произвольный</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Дата начала</label>
          <input type="date" class="form-input" [value]="dateFrom()" (input)="onCustomDate('from', asValue($event))" />
        </div>
        <div class="form-group">
          <label class="form-label">Дата окончания</label>
          <input type="date" class="form-input" [value]="dateTo()" (input)="onCustomDate('to', asValue($event))" />
        </div>
      </div>

      <div class="settings-row">
        <div class="form-group">
          <label class="form-label">Статусы заказов</label>
          <select class="form-select" [value]="statusFilter()" (change)="statusFilter.set(asValue($event))">
            <option value="all">Все статусы</option>
            <option value="new">Новые</option>
            <option value="measuring">Замеры</option>
            <option value="approval">Согласование</option>
            <option value="production">Изготовление</option>
            <option value="installation">Монтаж</option>
            <option value="done">Выполненные</option>
            <option value="cancelled">Отменённые</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Формат файла</label>
          <select class="form-select" [value]="fileFormat()" (change)="fileFormat.set(asValue($event))">
            <option value="xlsx">Excel (.xlsx)</option>
            <option value="csv">CSV</option>
            <option value="pdf">PDF</option>
          </select>
        </div>
        <div class="form-group" style="justify-content: flex-end;">
          <button class="btn-ghost btn-preview" (click)="loadPreview()" [disabled]="loading()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {{ loading() ? 'Загрузка...' : 'Предпросмотр' }}
          </button>
        </div>
      </div>
    </div>

    <div class="report-actions">
      <button class="btn-ghost btn-primary" (click)="generateReport()" [disabled]="exporting()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        {{ exporting() ? 'Формирую...' : 'Скачать ' + fileFormat().toUpperCase() }}
      </button>
      <span class="action-hint">{{ getReportTitle() }} · {{ dateFrom() }} — {{ dateTo() }}</span>
    </div>

    <div class="preview-section">
      <div class="preview-header">
        <h2>Предпросмотр</h2>
        @if (previewData()) {
          <span class="preview-count">{{ previewData()!.rows.length }} записей</span>
        }
      </div>
      <div class="preview-frame">
        @if (loading()) {
          <div class="preview-placeholder">
            <div class="spinner"></div>
            <p>Загружаю данные...</p>
          </div>
        } @else if (previewData()) {
          @if (previewData()!.summary) {
            <div class="summary-cards">
              @for (card of previewData()!.summary!; track card.label) {
                <div class="summary-card">
                  <div class="summary-card-value">{{ card.value }}</div>
                  <div class="summary-card-label">{{ card.label }}</div>
                </div>
              }
            </div>
          }
          @if (previewData()!.rows.length > 0) {
            <div class="preview-content">
              <table class="preview-table">
                <thead>
                  <tr>
                    @for (col of previewData()!.columns; track col) {
                      <th>{{ col }}</th>
                    }
                  </tr>
                </thead>
                <tbody>
                  @for (row of previewData()!.rows.slice(0, 20); track $index) {
                    <tr>
                      @for (cell of row; track $index) {
                        <td>{{ cell }}</td>
                      }
                    </tr>
                  }
                </tbody>
              </table>
              @if (previewData()!.rows.length > 20) {
                <div class="preview-more">Показаны первые 20 из {{ previewData()!.rows.length }} записей. Скачайте файл для полного отчёта.</div>
              }
            </div>
          } @else {
            <div class="preview-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              <p>Нет данных за выбранный период</p>
            </div>
          }
        } @else {
          <div class="preview-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <p>Выберите тип отчёта и нажмите «Предпросмотр»</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-8);
      flex-wrap: wrap;
      gap: var(--space-4);
    }
    .page-header h1 {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      text-transform: uppercase;
      letter-spacing: 0.02em;
      line-height: 1;
      margin: 0;
    }
    .page-subtitle {
      color: var(--muted);
      font-size: 14px;
      margin-top: var(--space-2);
    }

    .btn-ghost {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: var(--border-soft);
      border: 1px solid var(--border);
      border-radius: var(--radius-pill);
      color: var(--fg);
      font-size: var(--text-sm);
      letter-spacing: 1px;
      text-transform: uppercase;
      transition: all 0.2s ease;
      cursor: pointer;
      font-family: inherit;
    }
    .btn-ghost:hover:not(:disabled) { background: rgba(240, 240, 250, 0.2); }
    .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost svg { width: 16px; height: 16px; flex-shrink: 0; }
    .btn-ghost.btn-primary {
      background: var(--fg);
      border-color: var(--fg);
      color: var(--bg);
    }
    .btn-ghost.btn-primary:hover:not(:disabled) { opacity: 0.85; }
    .btn-preview { width: 100%; justify-content: center; }

    .reports-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-5);
      margin-bottom: var(--space-8);
    }
    .report-card {
      background: var(--border-soft);
      border: 1px solid var(--border-soft);
      padding: var(--space-6);
      transition: all 0.2s ease;
      cursor: pointer;
      position: relative;
    }
    .report-card:hover { border-color: var(--border); background: rgba(240, 240, 250, 0.08); }
    .report-card.selected { border-color: var(--fg); background: rgba(240, 240, 250, 0.1); }
    .report-card-icon { width: 40px; height: 40px; margin-bottom: var(--space-4); color: var(--muted); }
    .report-card.selected .report-card-icon { color: var(--fg); }
    .report-card h3 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      text-transform: uppercase;
      letter-spacing: 0.02em;
      margin: 0 0 var(--space-2);
    }
    .report-card p { font-size: 13px; color: var(--muted); line-height: 1.5; margin: 0; }
    .report-card-check {
      width: 20px; height: 20px;
      border: 2px solid var(--border);
      border-radius: 50%;
      margin-top: var(--space-4);
      display: flex; align-items: center; justify-content: center;
      transition: all 0.15s ease;
    }
    .report-card.selected .report-card-check { background: var(--fg); border-color: var(--fg); }
    .report-card-check svg { width: 12px; height: 12px; color: var(--bg); opacity: 0; }
    .report-card.selected .report-card-check svg { opacity: 1; }

    .report-settings {
      background: var(--border-soft);
      border: 1px solid var(--border-soft);
      padding: var(--space-6);
      margin-bottom: var(--space-6);
    }
    .settings-title {
      font-size: var(--text-xs);
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: var(--space-5);
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border-soft);
    }
    .settings-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-5);
      margin-bottom: var(--space-4);
    }
    .settings-row:last-child { margin-bottom: 0; }
    .form-group { display: flex; flex-direction: column; gap: var(--space-2); }
    .form-label { font-size: var(--text-sm); color: var(--muted); letter-spacing: 0.5px; }
    .form-input, .form-select {
      padding: var(--space-3) var(--space-4);
      background: var(--bg);
      border: 1px solid var(--border-soft);
      color: var(--fg);
      font-family: var(--font-body);
      font-size: 14px;
      transition: border-color 0.15s ease;
    }
    .form-input:focus, .form-select:focus { outline: none; border-color: var(--border); }
    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(240,240,250,0.5)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 40px;
    }

    .report-actions {
      display: flex;
      gap: var(--space-4);
      align-items: center;
      flex-wrap: wrap;
      margin-bottom: var(--space-8);
    }
    .action-hint { font-size: var(--text-sm); color: var(--muted); margin-left: auto; }

    .preview-section {}
    .preview-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-5);
    }
    .preview-header h2 {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      text-transform: uppercase;
      letter-spacing: 0.02em;
      line-height: 1;
      margin: 0;
    }
    .preview-count {
      font-size: var(--text-sm);
      color: var(--muted);
      font-family: var(--font-mono);
    }
    .preview-frame {
      background: var(--border-soft);
      border: 1px solid var(--border-soft);
      min-height: 380px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--muted);
    }
    .preview-placeholder { text-align: center; padding: var(--space-8); }
    .preview-placeholder svg { width: 48px; height: 48px; margin-bottom: var(--space-4); opacity: 0.4; }
    .preview-placeholder p { margin: 0; font-size: 14px; }

    .spinner {
      width: 32px; height: 32px;
      border: 3px solid var(--border-soft);
      border-top-color: var(--fg);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin: 0 auto var(--space-4);
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .summary-cards {
      display: flex;
      gap: var(--space-4);
      padding: var(--space-5);
      border-bottom: 1px solid var(--border-soft);
      width: 100%;
      flex-wrap: wrap;
    }
    .summary-card {
      flex: 1;
      min-width: 120px;
      background: var(--bg);
      border: 1px solid var(--border-soft);
      padding: var(--space-4);
      text-align: center;
    }
    .summary-card-value {
      font-family: var(--font-display);
      font-size: var(--text-xl);
      line-height: 1;
      margin-bottom: var(--space-1);
    }
    .summary-card-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }

    .preview-content { width: 100%; overflow-x: auto; align-self: flex-start; }
    .preview-table { width: 100%; border-collapse: collapse; }
    .preview-table th, .preview-table td {
      padding: var(--space-3) var(--space-4);
      text-align: left;
      border-bottom: 1px solid var(--border-soft);
      font-size: 13px;
      white-space: nowrap;
    }
    .preview-table th {
      font-family: var(--font-mono);
      font-size: var(--text-xs);
      letter-spacing: 1px;
      text-transform: uppercase;
      color: var(--muted);
      font-weight: 400;
      position: sticky;
      top: 0;
      background: var(--border-soft);
    }
    .preview-more {
      padding: var(--space-4);
      text-align: center;
      font-size: 13px;
      color: var(--muted);
      border-top: 1px solid var(--border-soft);
    }

    @media (max-width: 1200px) { .reports-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 920px) { .settings-row { grid-template-columns: 1fr; } }
    @media (max-width: 768px) { .reports-grid { grid-template-columns: 1fr; } }
  `],
})
export class ReportsComponent {
  private api = inject(ApiService);

  selectedReport = signal('orders');
  period = signal('current_month');
  dateFrom = signal(this.calcDates('current_month').from);
  dateTo = signal(this.calcDates('current_month').to);
  statusFilter = signal('all');
  fileFormat = signal('xlsx');
  loading = signal(false);
  exporting = signal(false);
  previewData = signal<{ columns: string[]; rows: any[][]; summary?: { label: string; value: string }[] } | null>(null);

  reportTypes = [
    { key: 'orders', title: 'Отчёт по заказам', description: 'Список всех заказов за период с детализацией по типам работ, статусам и суммам', iconPath: '<path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 12h6M9 16h6"/>' },
    { key: 'revenue', title: 'Финансовый отчёт', description: 'Выручка по месяцам, оплачено и задолженность. Сравнение периодов', iconPath: '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>' },
    { key: 'clients', title: 'База клиентов', description: 'Список клиентов с историей заказов, контактами и суммой всех сделок', iconPath: '<path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>' },
    { key: 'works', title: 'Виды работ', description: 'Статистика по типам металлоконструкций: популярность, средний чек, выполнено', iconPath: '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>' },
    { key: 'workload', title: 'Загрузка по месяцам', description: 'Календарь занятости: новые заказы, в работе, выполнено и отменено по месяцам', iconPath: '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
    { key: 'materials', title: 'Типы объектов', description: 'Распределение заказов по категориям и анализ среднего чека по каждой категории', iconPath: '<path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>' },
  ];

  selectReport(key: string): void {
    this.selectedReport.set(key);
    this.previewData.set(null);
  }

  onPeriodChange(val: string): void {
    this.period.set(val);
    if (val !== 'custom') {
      const dates = this.calcDates(val);
      this.dateFrom.set(dates.from);
      this.dateTo.set(dates.to);
    }
  }

  onCustomDate(which: 'from' | 'to', val: string): void {
    this.period.set('custom');
    if (which === 'from') this.dateFrom.set(val);
    else this.dateTo.set(val);
  }

  getReportTitle(): string {
    return this.reportTypes.find(r => r.key === this.selectedReport())?.title || 'Отчёт';
  }

  loadPreview(): void {
    this.loading.set(true);
    this.previewData.set(null);
    const params = this.buildParams();

    const reportType = this.selectedReport();

    if (reportType === 'orders') {
      this.api.getOrdersReport(params).subscribe({
        next: (data) => {
          const summary = [
            { label: 'Заказов', value: String(data.summary?.total ?? data.orders?.length ?? 0) },
            { label: 'Общая сумма', value: this.fmt(data.summary?.totalAmount) },
          ];
          const columns = ['Номер', 'Тип работы', 'Клиент', 'Телефон', 'Статус', 'Сумма, ₽', 'Дата'];
          const rows = (data.orders || []).map((o: any) => [
            o.orderNumber,
            this.typeName(o.type),
            o.client?.name || '—',
            o.client?.phone || '—',
            this.statusName(o.status),
            o.amount ? o.amount.toLocaleString('ru-RU') : '—',
            this.fmtDate(o.createdAt),
          ]);
          this.previewData.set({ columns, rows, summary });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    } else if (reportType === 'revenue') {
      this.api.getRevenueReport(params).subscribe({
        next: (data) => {
          const summary = [
            { label: 'Выручка', value: this.fmt(data.totalRevenue) },
            { label: 'Оплачено', value: this.fmt(data.totalPaid) },
            { label: 'Задолженность', value: this.fmt(data.outstanding) },
            { label: 'Заказов', value: String(data.orderCount) },
          ];
          const columns = ['Месяц', 'Заказов', 'Выручка, ₽', 'Оплачено, ₽', 'Долг, ₽'];
          const rows = Object.entries(data.byMonth || {}).map(([month, d]: [string, any]) => [
            this.fmtMonth(month),
            d.count,
            d.revenue.toLocaleString('ru-RU'),
            d.paid.toLocaleString('ru-RU'),
            (d.revenue - d.paid).toLocaleString('ru-RU'),
          ]);
          this.previewData.set({ columns, rows, summary });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    } else if (reportType === 'clients') {
      this.api.getClientsReport().subscribe({
        next: (data: any[]) => {
          const summary = [
            { label: 'Клиентов', value: String(data.length) },
            { label: 'Общая сумма', value: this.fmt(data.reduce((s, c) => s + c.totalAmount, 0)) },
          ];
          const columns = ['Клиент', 'Телефон', 'Email', 'Заказов', 'Сумма, ₽', 'Последний заказ'];
          const rows = data.map((c: any) => [
            c.name, c.phone, c.email || '—',
            c.totalOrders,
            c.totalAmount.toLocaleString('ru-RU'),
            c.lastOrderDate ? this.fmtDate(c.lastOrderDate) : '—',
          ]);
          this.previewData.set({ columns, rows, summary });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    } else if (reportType === 'works' || reportType === 'materials') {
      this.api.getWorksReport(params).subscribe({
        next: (data: any[]) => {
          const summary = [
            { label: 'Типов работ', value: String(data.length) },
            { label: 'Всего заказов', value: String(data.reduce((s, d) => s + d.count, 0)) },
          ];
          const columns = ['Тип работы', 'Заказов', 'Выполнено', 'Средний чек, ₽', 'Всего, ₽', 'Доля, %'];
          const rows = data.map((d: any) => [
            d.typeName, d.count, d.doneCount,
            d.avgAmount.toLocaleString('ru-RU'),
            d.totalAmount.toLocaleString('ru-RU'),
            d.sharePercent + '%',
          ]);
          this.previewData.set({ columns, rows, summary });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    } else if (reportType === 'workload') {
      this.api.getWorkloadReport(params).subscribe({
        next: (data: any) => {
          const summary = [
            { label: 'Месяцев', value: String(data.months?.length ?? 0) },
            { label: 'Всего заказов', value: String(data.totalOrders ?? 0) },
          ];
          const columns = ['Месяц', 'Всего', 'Новые', 'В работе', 'Выполнено', 'Отменено'];
          const rows = (data.months || []).map((m: any) => [
            this.fmtMonth(m.month), m.total, m.new, m.inProgress, m.done, m.cancelled,
          ]);
          this.previewData.set({ columns, rows, summary });
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    } else {
      this.loading.set(false);
    }
  }

  generateReport(): void {
    this.exporting.set(true);
    const reportKey = this.selectedReport() === 'materials' ? 'works' : this.selectedReport();
    const params = { ...this.buildParams(), type: reportKey, format: this.fileFormat() };
    this.api.exportReport(params.type, params.format, this.buildParams()).subscribe({
      next: (blob) => {
        const ext = this.fileFormat();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${reportKey}_${this.dateFrom()}_${this.dateTo()}.${ext}`;
        a.click();
        URL.revokeObjectURL(url);
        this.exporting.set(false);
      },
      error: () => this.exporting.set(false),
    });
  }

  asValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  private buildParams() {
    const p: any = { startDate: this.dateFrom(), endDate: this.dateTo() };
    if (this.statusFilter() !== 'all') p.status = this.statusFilter();
    return p;
  }

  private calcDates(period: string): { from: string; to: string } {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    if (period === 'current_month') {
      return { from: `${y}-${pad(m + 1)}-01`, to: fmt(now) };
    }
    if (period === 'last_month') {
      const first = new Date(y, m - 1, 1);
      const last = new Date(y, m, 0);
      return { from: fmt(first), to: fmt(last) };
    }
    if (period === 'current_quarter') {
      const q = Math.floor(m / 3);
      const first = new Date(y, q * 3, 1);
      return { from: fmt(first), to: fmt(now) };
    }
    if (period === 'current_year') {
      return { from: `${y}-01-01`, to: fmt(now) };
    }
    if (period === 'all_time') {
      return { from: '2020-01-01', to: fmt(now) };
    }
    return { from: fmt(new Date(y, m, 1)), to: fmt(now) };
  }

  private fmt(n: number | undefined | null): string {
    if (n == null) return '—';
    return n.toLocaleString('ru-RU') + ' ₽';
  }

  private fmtDate(d: string | Date | null): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('ru-RU');
  }

  private fmtMonth(iso: string): string {
    const months = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
    const [y, m] = iso.split('-');
    return `${months[parseInt(m) - 1]} ${y}`;
  }

  private typeName(type: string): string {
    const m: Record<string, string> = { gates: 'Ворота', stairs: 'Лестница', canopy: 'Навес', fence: 'Ограждение', frame: 'Каркас', other: 'Другое' };
    return m[type] || type;
  }

  private statusName(s: string): string {
    const m: Record<string, string> = { new: 'Новая', measuring: 'Замеры', approval: 'Согласование', production: 'Изготовление', installation: 'Монтаж', done: 'Выполнен', cancelled: 'Отменён' };
    return m[s] || s;
  }
}
