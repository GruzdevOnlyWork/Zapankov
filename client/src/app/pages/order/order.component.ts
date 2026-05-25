import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-order',
  standalone: true,
  imports: [FormsModule, RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar />

    <section class="page-header">
      <div class="container">
        <p class="eyebrow">Заявка</p>
        <h1 class="h1">Оставить заявку</h1>
        <p class="lead">Опишите ваш проект — мы свяжемся с вами в течение нескольких часов.</p>
      </div>
    </section>

    <section class="section">
      <div class="container layout">

        @if (submitted()) {
          <div class="success-state">
            <div class="success-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
            <h2 class="h3">Заявка отправлена</h2>
            <p class="lead">Спасибо! Мы свяжемся с вами в ближайшее время для уточнения деталей проекта.</p>
            <a class="btn-ghost" routerLink="/">На главную</a>
          </div>
        } @else {
          <form class="order-form" (ngSubmit)="onSubmit()" #orderForm="ngForm">

            <div class="form-section">
              <label class="section-label">Тип услуги</label>
              <div class="chips">
                @for (chip of serviceChips; track chip) {
                  <button
                    type="button"
                    class="chip"
                    [class.active]="selectedServices().includes(chip)"
                    (click)="toggleService(chip)"
                  >{{ chip }}</button>
                }
              </div>
            </div>

            <div class="form-section">
              <label class="section-label">Контактные данные</label>
              <div class="field-row">
                <div class="field">
                  <label for="name">Имя *</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    [(ngModel)]="formData.name"
                    required
                    placeholder="Ваше имя"
                  />
                </div>
                <div class="field">
                  <label for="phone">Телефон *</label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    [(ngModel)]="formData.phone"
                    required
                    placeholder="+7 (___) ___-__-__"
                  />
                </div>
              </div>
              <div class="field">
                <label for="email">Email</label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  [(ngModel)]="formData.email"
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div class="form-section">
              <label class="section-label">О проекте</label>
              <div class="field">
                <label for="address">Адрес объекта</label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  [(ngModel)]="formData.address"
                  placeholder="Город, улица, дом"
                />
              </div>
              <div class="field">
                <label for="deadline">Желаемые сроки</label>
                <select id="deadline" name="deadline" [(ngModel)]="formData.deadline">
                  <option value="">Выберите сроки</option>
                  <option value="urgent">Срочно</option>
                  <option value="month">В течение месяца</option>
                  <option value="flexible">Сроки гибкие</option>
                </select>
              </div>
              <div class="field">
                <label for="description">Описание проекта *</label>
                <textarea
                  id="description"
                  name="description"
                  [(ngModel)]="formData.description"
                  required
                  placeholder="Опишите, что нужно сделать. Размеры, материалы, особые пожелания..."
                  rows="5"
                ></textarea>
              </div>
            </div>

            <div class="consent-field">
              <label class="consent-label">
                <input
                  type="checkbox"
                  name="consent"
                  [(ngModel)]="consent"
                  required
                />
                <span>Я даю согласие на <a href="javascript:void(0)" (click)="showPolicy.set(!showPolicy())">обработку персональных данных</a></span>
              </label>
              @if (showPolicy()) {
                <div class="policy-text">
                  <p>Нажимая кнопку «Отправить заявку», вы даёте согласие на обработку персональных данных (имя, телефон, email) в соответствии с Федеральным законом №152-ФЗ «О персональных данных». Ваши данные используются исключительно для связи по вашему запросу и не передаются третьим лицам.</p>
                </div>
              }
            </div>

            <button
              type="submit"
              class="btn-ghost btn-primary submit-btn"
              [disabled]="submitting() || !consent"
            >
              {{ submitting() ? 'Отправка...' : 'Отправить заявку' }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            @if (error()) {
              <p class="error-msg">{{ error() }}</p>
            }
          </form>

          <aside class="sidebar">
            <div class="sidebar-block">
              <h3 class="h3">Контакты</h3>
              <div class="contact-list">
                <div class="contact-item">
                  <span class="meta">Телефон</span>
                  <a href="tel:+79206487112">+7 (920) 648-71-12</a>
                </div>
                <div class="contact-item">
                  <span class="meta">Email</span>
                  <a href="mailto:zapankovegor&#64;mail.ru">zapankovegor&#64;mail.ru</a>
                </div>
                <div class="contact-item">
                  <span class="meta">Адрес</span>
                  <span>г. Буй, ул. Менжинского, 37</span>
                </div>
              </div>
            </div>

            <div class="sidebar-block">
              <h3 class="h3">Как работаем</h3>
              <div class="process-steps">
                @for (step of processSteps; track step.num) {
                  <div class="process-step">
                    <span class="meta">{{ step.num }}</span>
                    <div>
                      <strong>{{ step.title }}</strong>
                      <p>{{ step.desc }}</p>
                    </div>
                  </div>
                }
              </div>
            </div>
          </aside>
        }
      </div>
    </section>

    <app-footer />
  `,
  styles: [`
    .page-header {
      padding-top: 160px;
      padding-bottom: 80px;
      border-bottom: 1px solid var(--border-soft);
    }

    .page-header .h1 {
      margin-bottom: var(--space-6);
    }

    .section {
      padding: 80px 0;
    }

    .layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 80px;
      align-items: start;
    }

    .form-section {
      margin-bottom: var(--space-8);
    }

    .section-label {
      display: block;
      font-family: var(--font-display);
      font-size: var(--text-sm);
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--fg);
      margin-bottom: var(--space-5);
      padding-bottom: var(--space-3);
      border-bottom: 1px solid var(--border-soft);
    }

    .field-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-4);
    }

    .chips {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
    }

    .chip {
      padding: 10px 20px;
      border-radius: var(--radius-pill);
      border: 1px solid var(--border-soft);
      background: transparent;
      color: var(--muted);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .chip:hover {
      border-color: var(--border);
      color: var(--fg);
    }

    .chip.active {
      background: var(--fg);
      border-color: var(--fg);
      color: var(--bg);
    }

    .submit-btn {
      width: 100%;
      justify-content: center;
      margin-top: var(--space-4);
    }

    .error-msg {
      color: var(--status-cancelled);
      font-size: var(--text-sm);
      margin-top: var(--space-4);
      text-align: center;
    }

    .sidebar {
      position: sticky;
      top: 96px;
      display: flex;
      flex-direction: column;
      gap: var(--space-8);
    }

    .sidebar-block {
      padding: var(--space-6);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-sm);
    }

    .sidebar-block .h3 {
      margin-bottom: var(--space-6);
      font-size: var(--text-base);
    }

    .contact-list {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    .contact-item {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
    }

    .contact-item a {
      color: var(--fg);
      transition: opacity 0.2s;
    }

    .contact-item a:hover {
      opacity: 0.7;
    }

    .process-steps {
      display: flex;
      flex-direction: column;
      gap: var(--space-5);
    }

    .process-step {
      display: flex;
      gap: var(--space-4);
    }

    .process-step .meta {
      flex-shrink: 0;
      margin-top: 2px;
    }

    .process-step strong {
      display: block;
      font-size: var(--text-sm);
      margin-bottom: var(--space-1);
    }

    .process-step p {
      font-size: var(--text-sm);
      color: var(--muted);
      line-height: 1.5;
    }

    .consent-field {
      margin-top: var(--space-6);
    }

    .consent-label {
      display: flex;
      align-items: flex-start;
      gap: var(--space-3);
      font-size: var(--text-sm);
      color: var(--muted);
      cursor: pointer;
    }

    .consent-label input[type="checkbox"] {
      margin-top: 3px;
      flex-shrink: 0;
      accent-color: var(--fg);
    }

    .consent-label a {
      color: var(--fg);
      text-decoration: underline;
      text-underline-offset: 2px;
    }

    .consent-label a:hover {
      opacity: 0.7;
    }

    .policy-text {
      margin-top: var(--space-3);
      padding: var(--space-4);
      border: 1px solid var(--border-soft);
      border-radius: var(--radius-sm);
      font-size: var(--text-sm);
      color: var(--muted);
      line-height: 1.6;
    }

    .policy-text p {
      margin: 0;
    }

    .success-state {
      grid-column: 1 / -1;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-6);
      padding: 80px 0;
    }

    .success-icon {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: rgba(34, 197, 94, 0.15);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .success-icon svg {
      width: 40px;
      height: 40px;
      color: var(--success);
    }

    @media (max-width: 1024px) {
      .layout {
        grid-template-columns: 1fr;
        gap: 48px;
      }

      .sidebar {
        position: static;
      }
    }

    @media (max-width: 768px) {
      .page-header {
        padding-top: 120px;
        padding-bottom: 48px;
      }

      .section {
        padding: 48px 0;
      }

      .field-row {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class OrderComponent {
  private api = inject(ApiService);

  submitted = signal(false);
  submitting = signal(false);
  error = signal('');
  selectedServices = signal<string[]>([]);
  showPolicy = signal(false);
  consent = false;

  serviceChips = ['Ворота', 'Лестница', 'Навес', 'Ограждение', 'Каркас', 'Другое'];

  formData = {
    name: '',
    phone: '',
    email: '',
    address: '',
    deadline: '',
    description: '',
  };

  processSteps = [
    { num: '01', title: 'Заявка', desc: 'Вы оставляете заявку или звоните нам.' },
    { num: '02', title: 'Замер и расчёт', desc: 'Выезжаем на объект, делаем замеры и расчёт стоимости.' },
    { num: '03', title: 'Изготовление', desc: 'Изготавливаем конструкцию на производстве.' },
    { num: '04', title: 'Монтаж', desc: 'Доставляем и устанавливаем на объекте.' },
  ];

  toggleService(chip: string): void {
    this.selectedServices.update(services => {
      if (services.includes(chip)) {
        return services.filter(s => s !== chip);
      }
      return [...services, chip];
    });
  }

  onSubmit(): void {
    if (!this.formData.name || !this.formData.phone || !this.formData.description) {
      this.error.set('Пожалуйста, заполните все обязательные поля.');
      return;
    }

    this.error.set('');
    this.submitting.set(true);

    const payload = {
      ...this.formData,
      services: this.selectedServices(),
    };

    this.api.submitRequest(payload).subscribe({
      next: () => {
        this.submitting.set(false);
        this.submitted.set(true);
      },
      error: () => {
        this.submitting.set(false);
        this.error.set('Произошла ошибка. Попробуйте позже или свяжитесь по телефону.');
      },
    });
  }
}
