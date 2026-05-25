import { Component, signal, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, NavbarComponent, FooterComponent],
  template: `
    <app-navbar />

    <section class="hero">
      <div class="container hero-inner">
        <p class="eyebrow">Металлоконструкции &middot; г. Буй</p>
        <h1 class="h1">Металлоконструкции любой сложности под ваш проект</h1>
        <p class="lead">
          Проектирование, изготовление и монтаж металлоконструкций.
          Индивидуальный подход, точные сроки, честная цена.
        </p>
        <div class="hero-actions">
          <a class="btn-ghost btn-primary" routerLink="/order">
            Оставить заявку
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
          <a class="btn-ghost" href="#portfolio">
            Смотреть работы
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 9l6 6 6-6"/>
            </svg>
          </a>
        </div>
        <div class="scroll-indicator">
          <div class="scroll-line"></div>
        </div>
      </div>
    </section>

    <section class="section" id="services">
      <div class="container">
        <p class="eyebrow">Услуги</p>
        <h2 class="h2">Что мы делаем</h2>
        <div class="services-grid">
          @for (service of services; track service.num) {
            <div class="service-card">
              <span class="meta">{{ service.num }}</span>
              <h3 class="h3">{{ service.title }}</h3>
              <p class="service-desc">{{ service.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="section" id="portfolio">
      <div class="container">
        <div class="section-header">
          <div>
            <p class="eyebrow">Портфолио</p>
            <h2 class="h2">Наши работы</h2>
          </div>
          <a class="btn-ghost btn-ghost-sm" routerLink="/portfolio">
            Все работы
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
        <div class="portfolio-grid">
          @for (item of portfolioPreview(); track item.id) {
            <div class="portfolio-item">
              <div class="portfolio-img" [style.background-image]="item.imageUrl ? 'url(' + item.imageUrl + ')' : ''">
                @if (!item.imageUrl) {
                  <div class="portfolio-placeholder">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                }
              </div>
              <div class="portfolio-overlay">
                <span class="meta">{{ getCategoryName(item.category) }}</span>
                <h3>{{ item.title }}</h3>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <section class="section cta-section">
      <div class="container cta-inner">
        <h2 class="h2">Готовы обсудить проект?</h2>
        <p class="lead">Расскажите о вашей задаче — предложим оптимальное решение и рассчитаем стоимость.</p>
        <a class="btn-ghost btn-primary" routerLink="/order">
          Оставить заявку
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </div>
    </section>

    <app-footer />
  `,
  styles: [`
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding-top: 64px;
      position: relative;
    }

    .hero-inner {
      padding-top: var(--space-12);
      padding-bottom: var(--space-12);
    }

    .hero .h1 {
      max-width: 14ch;
      margin-bottom: var(--space-6);
    }

    .hero .lead {
      margin-bottom: var(--space-8);
    }

    .hero-actions {
      display: flex;
      gap: var(--space-4);
      flex-wrap: wrap;
    }

    .scroll-indicator {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
    }

    .scroll-line {
      width: 1px;
      height: 48px;
      background: var(--border);
      position: relative;
      overflow: hidden;
    }

    .scroll-line::after {
      content: '';
      position: absolute;
      top: -48px;
      left: 0;
      width: 1px;
      height: 48px;
      background: var(--fg);
      animation: scrollBounce 2s ease-in-out infinite;
    }

    @keyframes scrollBounce {
      0% { transform: translateY(0); }
      50% { transform: translateY(96px); }
      100% { transform: translateY(0); }
    }

    .section {
      padding: 120px 0;
      border-top: 1px solid var(--border-soft);
    }

    .section .eyebrow {
      margin-bottom: var(--space-3);
    }

    .section .h2 {
      margin-bottom: 64px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-bottom: 64px;

      .h2 {
        margin-bottom: 0;
      }
    }

    .services-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1px;
      background: var(--border-soft);
    }

    .service-card {
      background: var(--bg);
      padding: var(--space-8);
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      transition: background 0.3s ease;
    }

    .service-card:hover {
      background: rgba(240, 240, 250, 0.03);
    }

    .service-card .meta {
      margin-bottom: var(--space-2);
    }

    .service-desc {
      color: var(--muted);
      font-size: var(--text-sm);
      line-height: 1.6;
    }

    .portfolio-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
    }

    .portfolio-item {
      position: relative;
      aspect-ratio: 16 / 10;
      border-radius: var(--radius-sm);
      overflow: hidden;
      cursor: pointer;
    }

    .portfolio-img {
      width: 100%;
      height: 100%;
      background-size: cover;
      background-position: center;
      background-color: var(--border-soft);
      transition: transform 0.5s ease;
    }

    .portfolio-item:hover .portfolio-img {
      transform: scale(1.05);
    }

    .portfolio-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: var(--space-6);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .portfolio-item:hover .portfolio-overlay {
      opacity: 1;
    }

    .portfolio-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--border-soft);
    }
    .portfolio-placeholder svg {
      width: 48px;
      height: 48px;
      color: var(--muted);
      opacity: 0.3;
    }

    .portfolio-overlay .meta {
      margin-bottom: var(--space-2);
    }

    .portfolio-overlay h3 {
      font-size: var(--text-lg);
    }

    .cta-section {
      padding: 120px 0;
    }

    .cta-inner {
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-6);
    }

    .cta-inner .lead {
      margin-bottom: var(--space-4);
    }

    @media (max-width: 1024px) {
      .services-grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 768px) {
      .section {
        padding: 80px 0;
      }

      .section .h2 {
        margin-bottom: 40px;
      }

      .services-grid {
        grid-template-columns: 1fr;
      }

      .portfolio-grid {
        grid-template-columns: 1fr;
      }

      .section-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-6);
      }

      .hero-actions {
        flex-direction: column;
      }

      .hero-actions .btn-ghost {
        text-align: center;
        justify-content: center;
      }

      .scroll-indicator {
        display: none;
      }
    }
  `],
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);

  portfolioPreview = signal<any[]>([]);

  private categoryMap: Record<string, string> = {
    gates: 'Ворота',
    stairs: 'Лестница',
    canopy: 'Навес',
    fence: 'Ограждение',
    frame: 'Каркас',
    other: 'Другое',
  };

  ngOnInit(): void {
    this.api.getPortfolio().subscribe({
      next: (items) => this.portfolioPreview.set(items.slice(0, 4)),
      error: () => {},
    });
  }

  getCategoryName(cat: string): string {
    return this.categoryMap[cat] || cat;
  }

  services = [
    { num: '01', title: 'Ворота и калитки', desc: 'Распашные, откатные, с автоматикой. Кованые элементы, профлист, сэндвич-панели.' },
    { num: '02', title: 'Лестницы', desc: 'Маршевые, винтовые, на косоурах. Для дома и улицы с перилами и ограждениями.' },
    { num: '03', title: 'Навесы и козырьки', desc: 'Для автомобилей, террас, входных групп. Поликарбонат, профнастил, стекло.' },
    { num: '04', title: 'Ограждения', desc: 'Заборы из профнастила, сетки, ковки. Перила для балконов и террас.' },
    { num: '05', title: 'Металлокаркасы', desc: 'Каркасы для домов, пристроек, гаражей. Расчёт нагрузок, проектирование.' },
    { num: '06', title: 'Индивидуальные изделия', desc: 'Мангалы, беседки, мебель. Любые изделия из металла по вашим чертежам.' },
  ];
}
