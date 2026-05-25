import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface OrderVM {
  id: number;
  orderNumber: string;
  type: string;
  status: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientId: number;
  description: string;
  location: string;
  deadline: string;
  amount: number | null;
  amountPaid: number | null;
  createdAt: string;
}

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [DatePipe, DecimalPipe, FormsModule],
  template: `
    <header class="page-header">
      <h1>Заказы</h1>
      <div class="header-actions">
        <button class="btn-ghost" (click)="toggleSearch()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
          Поиск
        </button>
        <button class="btn-ghost btn-primary" (click)="openCreatePanel()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          Новый заказ
        </button>
      </div>
    </header>

    @if (searchOpen()) {
      <div class="search-bar">
        <input
          type="text"
          class="form-input search-input"
          placeholder="Поиск по заказам..."
          [value]="searchQuery()"
          (input)="onSearch($event)"
          autofocus
        />
      </div>
    }

    <div class="tabs">
      @for (tab of tabs; track tab.key) {
        <button class="tab" [class.active]="activeTab() === tab.key" (click)="setTab(tab.key)">{{ tab.label }}</button>
      }
    </div>

    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Тип работы</th>
            <th>Клиент</th>
            <th>Статус</th>
            <th>Сумма</th>
            <th>Дата</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (order of filteredOrders(); track order.id) {
            <tr (click)="openDetail(order)">
              <td class="order-id">{{ order.orderNumber }}</td>
              <td class="order-type">{{ getTypeName(order.type) }}</td>
              <td class="order-client">
                <span class="order-client-name">{{ order.clientName }}</span>
                <span class="order-client-phone">{{ order.clientPhone }}</span>
              </td>
              <td><span class="status-badge" [class]="getStatusClass(order.status)">{{ getStatusName(order.status) }}</span></td>
              <td class="amount">{{ order.amount ? (order.amount | number: '1.0-0') + ' ₽' : '—' }}</td>
              <td class="date">{{ order.createdAt | date: 'dd.MM.yy' }}</td>
              <td>
                <div class="row-actions">
                  <button class="row-action" title="Открыть" (click)="openDetail(order); $event.stopPropagation()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button class="row-action" title="Редактировать" (click)="openEditForOrder(order); $event.stopPropagation()">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  </button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td colspan="7">
                <div class="empty-state">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>
                  <h3>Нет заказов</h3>
                  <p>{{ searchQuery() ? 'Не найдено по запросу' : 'Заказы появятся здесь' }}</p>
                </div>
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>

    <!-- ─── Detail overlay ─── -->
    <div class="overlay" [class.open]="detailOpen()" (click)="closeDetail()"></div>

    <!-- ─── Detail panel ─── -->
    <div class="detail-panel" [class.open]="detailOpen()">
      @if (selectedOrder(); as order) {
        <div class="detail-panel-header">
          <h2>{{ order.orderNumber }}</h2>
          <div style="display:flex;gap:8px;align-items:center;">
            @if (!editMode()) {
              <button class="icon-btn" title="Редактировать" (click)="enterEditMode()">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              </button>
            }
            <button class="detail-panel-close" (click)="closeDetail()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        </div>

        @if (!editMode()) {
          <!-- View mode -->
          <div class="detail-panel-content">
            <div class="detail-section">
              <div class="detail-section-title">Информация о заказе</div>
              <div class="detail-row"><span class="detail-row-label">Тип работы</span><span class="detail-row-value">{{ getTypeName(order.type) }}</span></div>
              <div class="detail-row"><span class="detail-row-label">Дата заявки</span><span class="detail-row-value">{{ order.createdAt | date: 'd MMMM yyyy' }}</span></div>
              @if (order.location) {
                <div class="detail-row"><span class="detail-row-label">Адрес</span><span class="detail-row-value">{{ order.location }}</span></div>
              }
              @if (order.deadline) {
                <div class="detail-row"><span class="detail-row-label">Срок</span><span class="detail-row-value">{{ order.deadline }}</span></div>
              }
            </div>

            @if (order.description) {
              <div class="detail-section">
                <div class="detail-section-title">Описание</div>
                <p class="detail-description">{{ order.description }}</p>
              </div>
            }

            <div class="detail-section">
              <div class="detail-section-title">Клиент</div>
              <div class="detail-row"><span class="detail-row-label">Имя</span><span class="detail-row-value">{{ order.clientName }}</span></div>
              <div class="detail-row"><span class="detail-row-label">Телефон</span><span class="detail-row-value">{{ order.clientPhone }}</span></div>
              @if (order.clientEmail) {
                <div class="detail-row"><span class="detail-row-label">E-mail</span><span class="detail-row-value">{{ order.clientEmail }}</span></div>
              }
            </div>

            <div class="detail-section">
              <div class="detail-section-title">Статус</div>
              <div class="status-select">
                @for (s of statusOptions; track s.key) {
                  <button class="status-option" [class.selected]="order.status === s.key" (click)="updateStatus(order, s.key)">{{ s.label }}</button>
                }
              </div>
            </div>

            <div class="detail-section">
              <div class="detail-section-title">Стоимость</div>
              <div class="detail-row">
                <span class="detail-row-label">Итоговая сумма</span>
                <span class="detail-row-value">{{ order.amount ? (order.amount | number: '1.0-0') + ' ₽' : '—' }}</span>
              </div>
              <div class="detail-row">
                <span class="detail-row-label">Оплачено</span>
                <span class="detail-row-value">{{ order.amountPaid ? (order.amountPaid | number: '1.0-0') + ' ₽' : '—' }}</span>
              </div>
              @if (order.amount && order.amountPaid) {
                <div class="detail-row">
                  <span class="detail-row-label">Долг</span>
                  <span class="detail-row-value debt">{{ (order.amount - order.amountPaid) | number: '1.0-0' }} ₽</span>
                </div>
              }
            </div>
          </div>
          <div class="detail-panel-footer">
            <a class="btn-ghost" [href]="'tel:' + order.clientPhone">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/></svg>
              Позвонить
            </a>
            <button class="btn-ghost" (click)="enterEditMode()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Редактировать
            </button>
          </div>

        } @else {
          <!-- Edit mode -->
          <div class="detail-panel-content">
            <div class="detail-section">
              <div class="detail-section-title">Редактирование заказа</div>
              <div class="form-group">
                <label class="form-label">Тип работы</label>
                <select class="form-select" [(ngModel)]="editForm.type">
                  @for (t of typeOptions; track t.key) {
                    <option [value]="t.key">{{ t.label }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Адрес / объект</label>
                <input class="form-input" type="text" [(ngModel)]="editForm.location" placeholder="Адрес объекта" />
              </div>
              <div class="form-group">
                <label class="form-label">Срок выполнения</label>
                <input class="form-input" type="text" [(ngModel)]="editForm.deadline" placeholder="Например: до 30 мая" />
              </div>
              <div class="form-group">
                <label class="form-label">Описание</label>
                <textarea class="form-input form-textarea" [(ngModel)]="editForm.description" placeholder="Описание заказа" rows="3"></textarea>
              </div>
            </div>
            <div class="detail-section">
              <div class="detail-section-title">Финансы</div>
              <div class="form-group">
                <label class="form-label">Итоговая сумма, ₽</label>
                <input class="form-input" type="number" [(ngModel)]="editForm.amount" placeholder="0" />
              </div>
              <div class="form-group">
                <label class="form-label">Оплачено, ₽</label>
                <input class="form-input" type="number" [(ngModel)]="editForm.amountPaid" placeholder="0" />
              </div>
            </div>
            <div class="detail-section">
              <div class="detail-section-title">Статус</div>
              <div class="status-select">
                @for (s of statusOptions; track s.key) {
                  <button class="status-option" [class.selected]="editForm.status === s.key" (click)="editForm.status = s.key">{{ s.label }}</button>
                }
              </div>
            </div>
          </div>
          <div class="detail-panel-footer">
            <button class="btn-ghost" (click)="cancelEdit()">Отмена</button>
            <button class="btn-ghost btn-primary" (click)="saveEdit()" [disabled]="saving()">
              {{ saving() ? 'Сохраняю...' : 'Сохранить' }}
            </button>
          </div>
        }
      }
    </div>

    <!-- ─── Create overlay ─── -->
    <div class="overlay" [class.open]="createOpen()" (click)="closeCreate()"></div>

    <!-- ─── Create panel ─── -->
    <div class="detail-panel" [class.open]="createOpen()">
      <div class="detail-panel-header">
        <h2>Новый заказ</h2>
        <button class="detail-panel-close" (click)="closeCreate()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="detail-panel-content">
        <div class="detail-section">
          <div class="detail-section-title">Клиент</div>
          <div class="client-search-wrap">
            <input
              class="form-input"
              type="text"
              [(ngModel)]="clientSearch"
              (input)="onClientSearch()"
              placeholder="Имя или телефон клиента..."
            />
            @if (clientResults().length > 0) {
              <div class="client-dropdown">
                @for (c of clientResults(); track c.id) {
                  <div class="client-option" (click)="selectClient(c)">
                    <span>{{ c.name }}</span>
                    <span class="client-option-phone">{{ c.phone }}</span>
                  </div>
                }
              </div>
            }
          </div>
          @if (selectedClientId()) {
            <div class="selected-client-badge">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {{ selectedClientName() }}
              <button (click)="clearClient()">×</button>
            </div>
          } @else {
            <div class="new-client-section">
              <div class="new-client-label">Новый клиент</div>
              <div class="form-group">
                <label class="form-label">Имя *</label>
                <input class="form-input" type="text" [(ngModel)]="newClientForm.name" placeholder="Иван Иванов" />
              </div>
              <div class="form-group">
                <label class="form-label">Телефон *</label>
                <input class="form-input" type="tel" [(ngModel)]="newClientForm.phone" placeholder="+7 999 000 00 00" />
              </div>
              <div class="form-group">
                <label class="form-label">Email</label>
                <input class="form-input" type="email" [(ngModel)]="newClientForm.email" placeholder="mail@example.com" />
              </div>
            </div>
          }
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Заказ</div>
          <div class="form-group">
            <label class="form-label">Тип работы *</label>
            <select class="form-select" [(ngModel)]="createForm.type">
              <option value="">— выберите тип —</option>
              @for (t of typeOptions; track t.key) {
                <option [value]="t.key">{{ t.label }}</option>
              }
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Адрес / объект</label>
            <input class="form-input" type="text" [(ngModel)]="createForm.location" placeholder="Адрес объекта" />
          </div>
          <div class="form-group">
            <label class="form-label">Срок</label>
            <input class="form-input" type="text" [(ngModel)]="createForm.deadline" placeholder="Например: до 30 мая" />
          </div>
          <div class="form-group">
            <label class="form-label">Описание</label>
            <textarea class="form-input form-textarea" [(ngModel)]="createForm.description" rows="3" placeholder="Детали заказа..."></textarea>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Финансы</div>
          <div class="form-group">
            <label class="form-label">Предварительная сумма, ₽</label>
            <input class="form-input" type="number" [(ngModel)]="createForm.amount" placeholder="0" />
          </div>
        </div>

        @if (createError()) {
          <div class="error-msg">{{ createError() }}</div>
        }
      </div>
      <div class="detail-panel-footer">
        <button class="btn-ghost" (click)="closeCreate()">Отмена</button>
        <button class="btn-ghost btn-primary" (click)="submitCreate()" [disabled]="saving()">
          {{ saving() ? 'Создаю...' : 'Создать заказ' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
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
    .header-actions { display: flex; gap: var(--space-3); }
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
      text-decoration: none;
    }
    .btn-ghost:hover:not(:disabled) { background: rgba(240, 240, 250, 0.2); }
    .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost svg { width: 16px; height: 16px; }
    .btn-ghost.btn-primary { background: var(--fg); border-color: var(--fg); color: var(--bg); }
    .btn-ghost.btn-primary:hover:not(:disabled) { opacity: 0.85; }

    .search-bar { margin-bottom: var(--space-5); }
    .form-input {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      background: var(--border-soft);
      border: 1px solid var(--border-soft);
      color: var(--fg);
      font-family: var(--font-body);
      font-size: 14px;
      transition: border-color 0.15s ease;
      box-sizing: border-box;
    }
    .form-input:focus { outline: none; border-color: var(--border); }
    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(240,240,250,0.5)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 40px;
      background-color: var(--border-soft);
    }
    .form-textarea { resize: vertical; min-height: 80px; }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }
    .stat-card { background: var(--border-soft); border: 1px solid var(--border-soft); padding: var(--space-5); }
    .stat-card-label { font-size: var(--text-xs); letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: var(--space-2); }
    .stat-card-value { font-family: var(--font-display); font-size: var(--text-2xl); line-height: 1; }

    .tabs {
      display: flex; gap: var(--space-1);
      margin-bottom: var(--space-5);
      border-bottom: 1px solid var(--border-soft);
      padding-bottom: var(--space-3);
      overflow-x: auto;
    }
    .tab {
      padding: var(--space-2) var(--space-4);
      color: var(--muted); font-size: var(--text-sm);
      letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap;
      transition: color 0.15s ease; background: none; border: none; cursor: pointer; font-family: inherit;
    }
    .tab:hover { color: var(--fg); }
    .tab.active { color: var(--fg); border-bottom: 2px solid var(--fg); margin-bottom: -13px; padding-bottom: 11px; }

    .table-container { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; }
    .data-table th, .data-table td { padding: var(--space-4); text-align: left; border-bottom: 1px solid var(--border-soft); }
    .data-table th { font-family: var(--font-mono); font-size: var(--text-xs); letter-spacing: 1px; text-transform: uppercase; color: var(--muted); font-weight: 400; white-space: nowrap; }
    .data-table tbody tr { transition: background 0.15s ease; cursor: pointer; }
    .data-table tbody tr:hover { background: var(--border-soft); }
    .data-table td { font-size: 14px; }

    .order-id { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--muted); }
    .order-type { font-weight: 500; }
    .order-client { display: flex; flex-direction: column; gap: 2px; }
    .order-client-name { font-weight: 500; }
    .order-client-phone { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--muted); }

    .status-badge {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 12px; border-radius: 999px;
      font-size: var(--text-xs); letter-spacing: 0.5px; text-transform: uppercase; white-space: nowrap;
    }
    .status-badge::before { content: ''; width: 6px; height: 6px; border-radius: 50%; }
    .status-new { background: rgba(59,130,246,.15); color: var(--status-new); }
    .status-new::before { background: var(--status-new); }
    .status-progress { background: rgba(245,158,11,.15); color: var(--status-progress); }
    .status-progress::before { background: var(--status-progress); }
    .status-done { background: rgba(34,197,94,.15); color: var(--status-done); }
    .status-done::before { background: var(--status-done); }
    .status-cancelled { background: rgba(239,68,68,.15); color: var(--status-cancelled); }
    .status-cancelled::before { background: var(--status-cancelled); }

    .amount { font-family: var(--font-mono); }
    .date { font-family: var(--font-mono); font-size: var(--text-sm); color: var(--muted); }
    .debt { color: #ef4444; }

    .row-actions { display: flex; gap: var(--space-2); }
    .row-action { padding: var(--space-2); color: var(--muted); border-radius: var(--radius-sm); transition: all 0.15s ease; background: none; border: none; cursor: pointer; }
    .row-action:hover { background: var(--border-soft); color: var(--fg); }
    .row-action svg { width: 16px; height: 16px; display: block; }

    .overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6); opacity: 0; visibility: hidden; transition: all 0.3s ease; z-index: 150; }
    .overlay.open { opacity: 1; visibility: visible; }

    .detail-panel {
      position: fixed; top: 0; right: 0; width: 480px; max-width: 100vw; height: 100vh;
      background: var(--bg); border-left: 1px solid var(--border-soft);
      transform: translateX(100%); transition: transform 0.3s ease; z-index: 200;
      display: flex; flex-direction: column;
    }
    .detail-panel.open { transform: translateX(0); }
    .detail-panel-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: var(--space-5); border-bottom: 1px solid var(--border-soft);
      flex-shrink: 0;
    }
    .detail-panel-header h2 { font-family: var(--font-display); font-size: var(--text-lg); text-transform: uppercase; letter-spacing: 0.02em; line-height: 1; margin: 0; }
    .detail-panel-close, .icon-btn { padding: var(--space-2); color: var(--muted); background: none; border: none; cursor: pointer; border-radius: var(--radius-sm); }
    .detail-panel-close:hover, .icon-btn:hover { color: var(--fg); background: var(--border-soft); }
    .detail-panel-close svg, .icon-btn svg { width: 20px; height: 20px; display: block; }
    .detail-panel-content { flex: 1; overflow-y: auto; padding: var(--space-5); }
    .detail-section { margin-bottom: var(--space-6); }
    .detail-section-title { font-size: var(--text-xs); letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: var(--space-4); padding-bottom: var(--space-2); border-bottom: 1px solid var(--border-soft); }
    .detail-row { display: flex; justify-content: space-between; margin-bottom: var(--space-3); font-size: 14px; }
    .detail-row-label { color: var(--muted); }
    .detail-row-value { text-align: right; max-width: 60%; }
    .detail-description { font-size: 14px; color: var(--muted); line-height: 1.6; margin: 0; }
    .detail-panel-footer { padding: var(--space-5); border-top: 1px solid var(--border-soft); display: flex; gap: var(--space-3); flex-shrink: 0; }
    .detail-panel-footer .btn-ghost { flex: 1; justify-content: center; }

    .status-select { display: flex; gap: var(--space-2); flex-wrap: wrap; }
    .status-option {
      padding: 8px 16px; border: 1px solid var(--border-soft); border-radius: var(--radius-pill);
      font-size: var(--text-xs); letter-spacing: 0.5px; text-transform: uppercase; color: var(--muted);
      transition: all 0.15s ease; background: none; cursor: pointer; font-family: inherit;
    }
    .status-option:hover { border-color: var(--border); color: var(--fg); }
    .status-option.selected { border-color: var(--fg); background: var(--fg); color: var(--bg); }

    .form-group { display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-4); }
    .form-group:last-child { margin-bottom: 0; }
    .form-label { font-size: var(--text-sm); color: var(--muted); }

    .client-search-wrap { position: relative; margin-bottom: var(--space-3); }
    .client-dropdown {
      position: absolute; top: 100%; left: 0; right: 0; z-index: 10;
      background: var(--bg); border: 1px solid var(--border); max-height: 200px; overflow-y: auto;
    }
    .client-option { padding: var(--space-3) var(--space-4); cursor: pointer; font-size: 14px; display: flex; justify-content: space-between; align-items: center; }
    .client-option:hover { background: var(--border-soft); }
    .client-option-phone { font-family: var(--font-mono); font-size: var(--text-xs); color: var(--muted); }
    .selected-client-badge {
      display: flex; align-items: center; gap: var(--space-2);
      padding: var(--space-2) var(--space-4);
      background: var(--border-soft); border: 1px solid var(--border); font-size: 14px;
    }
    .selected-client-badge svg { width: 16px; height: 16px; flex-shrink: 0; }
    .selected-client-badge button { margin-left: auto; background: none; border: none; color: var(--muted); cursor: pointer; font-size: 18px; line-height: 1; }
    .selected-client-badge button:hover { color: var(--fg); }
    .new-client-section { border: 1px solid var(--border-soft); padding: var(--space-4); margin-top: var(--space-3); }
    .new-client-label { font-size: var(--text-xs); letter-spacing: 1px; text-transform: uppercase; color: var(--muted); margin-bottom: var(--space-4); }

    .error-msg { padding: var(--space-3) var(--space-4); background: rgba(239,68,68,.15); color: #ef4444; font-size: 14px; margin-top: var(--space-4); }

    .empty-state { text-align: center; padding: var(--space-8) var(--space-4); color: var(--muted); }
    .empty-state svg { width: 48px; height: 48px; margin: 0 auto var(--space-4); opacity: 0.5; display: block; }
    .empty-state h3 { font-family: var(--font-display); font-size: var(--text-base); margin: 0 0 var(--space-2); color: var(--fg); text-transform: uppercase; letter-spacing: 0.02em; }
    .empty-state p { margin: 0; }

    @media (max-width: 1200px) { .stats-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 640px) { .stats-grid { grid-template-columns: 1fr; } }
  `],
})
export class OrdersComponent implements OnInit {
  private api = inject(ApiService);

  orders = signal<OrderVM[]>([]);
  activeTab = signal('all');
  searchOpen = signal(false);
  searchQuery = signal('');
  detailOpen = signal(false);
  createOpen = signal(false);
  selectedOrder = signal<OrderVM | null>(null);
  editMode = signal(false);
  saving = signal(false);
  createError = signal('');

  clientSearch = '';
  clientResults = signal<any[]>([]);
  selectedClientId = signal<number | null>(null);
  selectedClientName = signal('');
  private clientSearchTimer: any;

  editForm: any = {};
  createForm = { type: '', location: '', deadline: '', description: '', amount: null as number | null };
  newClientForm = { name: '', phone: '', email: '' };

  tabs = [
    { key: 'all', label: 'Все' },
    { key: 'new', label: 'Новые' },
    { key: 'progress', label: 'В работе' },
    { key: 'done', label: 'Выполнены' },
    { key: 'cancelled', label: 'Отменены' },
  ];

  statusOptions = [
    { key: 'new', label: 'Новая заявка' },
    { key: 'measuring', label: 'Замеры' },
    { key: 'approval', label: 'Согласование' },
    { key: 'production', label: 'Изготовление' },
    { key: 'installation', label: 'Монтаж' },
    { key: 'done', label: 'Выполнен' },
    { key: 'cancelled', label: 'Отменён' },
  ];

  typeOptions = [
    { key: 'gates', label: 'Ворота' },
    { key: 'stairs', label: 'Лестница' },
    { key: 'canopy', label: 'Навес' },
    { key: 'fence', label: 'Ограждение' },
    { key: 'frame', label: 'Каркас' },
    { key: 'other', label: 'Другое' },
  ];

  private statusMap: Record<string, string> = {
    new: 'Новая заявка', measuring: 'Замеры', approval: 'Согласование',
    production: 'Изготовление', installation: 'Монтаж', done: 'Выполнен', cancelled: 'Отменён',
  };

  private typeMap: Record<string, string> = {
    gates: 'Ворота', stairs: 'Лестница', canopy: 'Навес',
    fence: 'Ограждение', frame: 'Каркас', other: 'Другое',
  };

  private statusClassMap: Record<string, string> = {
    new: 'status-new', measuring: 'status-progress', approval: 'status-progress',
    production: 'status-progress', installation: 'status-progress',
    done: 'status-done', cancelled: 'status-cancelled',
  };

  private progressStatuses = new Set(['measuring', 'approval', 'production', 'installation']);

  filteredOrders = computed(() => {
    let list = this.orders();
    const tab = this.activeTab();
    if (tab === 'new') list = list.filter(o => o.status === 'new');
    else if (tab === 'progress') list = list.filter(o => this.progressStatuses.has(o.status));
    else if (tab === 'done') list = list.filter(o => o.status === 'done');
    else if (tab === 'cancelled') list = list.filter(o => o.status === 'cancelled');

    const q = this.searchQuery().toLowerCase();
    if (q) {
      list = list.filter(o =>
        o.clientName?.toLowerCase().includes(q) ||
        o.clientPhone?.includes(q) ||
        o.orderNumber?.toLowerCase().includes(q) ||
        this.getTypeName(o.type).toLowerCase().includes(q)
      );
    }
    return list;
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.api.getOrders().subscribe({
      next: (data: any[]) => {
        this.orders.set(data.map(o => this.mapOrder(o)));
      },
      error: () => {},
    });
  }

  private mapOrder(o: any): OrderVM {
    return {
      id: o.id,
      orderNumber: o.orderNumber,
      type: o.type,
      status: o.status,
      clientName: o.client?.name || '—',
      clientPhone: o.client?.phone || '',
      clientEmail: o.client?.email || '',
      clientId: o.clientId,
      description: o.description || '',
      location: o.location || '',
      deadline: o.deadline || '',
      amount: o.amount ?? null,
      amountPaid: o.amountPaid ?? null,
      createdAt: o.createdAt,
    };
  }

  setTab(key: string): void { this.activeTab.set(key); }

  toggleSearch(): void {
    this.searchOpen.update(v => !v);
    if (!this.searchOpen()) this.searchQuery.set('');
  }

  onSearch(event: Event): void {
    this.searchQuery.set((event.target as HTMLInputElement).value);
  }

  getStatusName(s: string): string { return this.statusMap[s] || s; }
  getStatusClass(s: string): string { return this.statusClassMap[s] || 'status-new'; }
  getTypeName(t: string): string { return this.typeMap[t] || t || 'Другое'; }

  openDetail(order: OrderVM): void {
    this.selectedOrder.set(order);
    this.editMode.set(false);
    this.detailOpen.set(true);
    this.createOpen.set(false);
  }

  closeDetail(): void {
    this.detailOpen.set(false);
    this.editMode.set(false);
  }

  enterEditMode(): void {
    const o = this.selectedOrder();
    if (!o) return;
    this.editForm = {
      type: o.type,
      status: o.status,
      location: o.location,
      deadline: o.deadline,
      description: o.description,
      amount: o.amount,
      amountPaid: o.amountPaid,
    };
    this.editMode.set(true);
  }

  openEditForOrder(order: OrderVM): void {
    this.selectedOrder.set(order);
    this.detailOpen.set(true);
    this.createOpen.set(false);
    setTimeout(() => this.enterEditMode(), 50);
  }

  cancelEdit(): void { this.editMode.set(false); }

  saveEdit(): void {
    const o = this.selectedOrder();
    if (!o) return;
    this.saving.set(true);
    this.api.updateOrder(o.id, this.editForm).subscribe({
      next: (updated: any) => {
        const vm = this.mapOrder(updated);
        this.selectedOrder.set(vm);
        this.orders.update(list => list.map(item => item.id === vm.id ? vm : item));
        this.editMode.set(false);
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  updateStatus(order: OrderVM, status: string): void {
    this.api.updateOrder(order.id, { status }).subscribe({
      next: (updated: any) => {
        const vm = this.mapOrder(updated);
        this.selectedOrder.set(vm);
        this.orders.update(list => list.map(item => item.id === vm.id ? vm : item));
      },
      error: () => {},
    });
  }

  openCreatePanel(): void {
    this.createOpen.set(true);
    this.detailOpen.set(false);
    this.createForm = { type: '', location: '', deadline: '', description: '', amount: null };
    this.newClientForm = { name: '', phone: '', email: '' };
    this.clientSearch = '';
    this.clientResults.set([]);
    this.selectedClientId.set(null);
    this.selectedClientName.set('');
    this.createError.set('');
  }

  closeCreate(): void { this.createOpen.set(false); }

  onClientSearch(): void {
    clearTimeout(this.clientSearchTimer);
    const q = this.clientSearch.trim();
    if (q.length < 2) { this.clientResults.set([]); return; }
    this.clientSearchTimer = setTimeout(() => {
      this.api.getClients({ search: q }).subscribe({
        next: (list: any[]) => this.clientResults.set(list.slice(0, 6)),
        error: () => this.clientResults.set([]),
      });
    }, 300);
  }

  selectClient(c: any): void {
    this.selectedClientId.set(c.id);
    this.selectedClientName.set(`${c.name} · ${c.phone}`);
    this.clientResults.set([]);
    this.clientSearch = c.name;
  }

  clearClient(): void {
    this.selectedClientId.set(null);
    this.selectedClientName.set('');
    this.clientSearch = '';
    this.clientResults.set([]);
  }

  submitCreate(): void {
    this.createError.set('');
    if (!this.createForm.type) { this.createError.set('Выберите тип работы'); return; }

    this.saving.set(true);

    const doCreate = (clientId: number) => {
      this.api.createOrder({ ...this.createForm, clientId }).subscribe({
        next: (order: any) => {
          this.orders.update(list => [this.mapOrder(order), ...list]);
            this.saving.set(false);
          this.closeCreate();
          this.openDetail(this.mapOrder(order));
        },
        error: () => {
          this.createError.set('Ошибка при создании заказа');
          this.saving.set(false);
        },
      });
    };

    if (this.selectedClientId()) {
      doCreate(this.selectedClientId()!);
    } else {
      if (!this.newClientForm.name || !this.newClientForm.phone) {
        this.createError.set('Введите имя и телефон клиента');
        this.saving.set(false);
        return;
      }
      this.api.createClient(this.newClientForm).subscribe({
        next: (client: any) => doCreate(client.id),
        error: () => {
          this.createError.set('Ошибка при создании клиента');
          this.saving.set(false);
        },
      });
    }
  }
}
