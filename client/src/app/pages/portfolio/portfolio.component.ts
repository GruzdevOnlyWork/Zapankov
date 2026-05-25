import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { NavbarComponent } from '../../shared/components/navbar/navbar.component';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { ApiService } from '../../core/services/api.service';

interface PortfolioItem {
  id: number;
  title: string;
  description?: string;
  category: string;
  imageUrl?: string;
  featured?: boolean;
}

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [NavbarComponent, FooterComponent],
  template: `
    <app-navbar />

    <section class="page-header">
      <div class="container">
        <p class="eyebrow">Портфолио</p>
        <h1 class="h1">Выполненные проекты</h1>
        <p class="lead">Каждый проект — индивидуальное решение. Здесь собраны примеры наших работ за последние годы.</p>
      </div>
    </section>

    <section class="section">
      <div class="container">
        <div class="filters">
          @for (tab of filterTabs; track tab.key) {
            <button
              class="filter-pill"
              [class.active]="activeFilter() === tab.key"
              (click)="setFilter(tab.key)"
            >{{ tab.label }}</button>
          }
        </div>

        <div class="portfolio-grid">
          @for (item of filteredItems(); track item.id) {
            <div class="portfolio-item" [class.featured]="item.featured">
              <div class="portfolio-img" [style.background-image]="item.imageUrl ? 'url(' + item.imageUrl + ')' : ''"></div>
              <div class="portfolio-overlay">
                <span class="meta">{{ getCategoryLabel(item.category) }}</span>
                <h3>{{ item.title }}</h3>
                @if (item.description) {
                  <p class="item-desc">{{ item.description }}</p>
                }
              </div>
            </div>
          }
        </div>

        @if (filteredItems().length === 0 && !loading()) {
          <div class="empty-state">
            <p class="lead">Проекты в этой категории скоро появятся.</p>
          </div>
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

    .filters {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      margin-bottom: 48px;
    }

    .filter-pill {
      padding: 10px 20px;
      border-radius: var(--radius-pill);
      border: 1px solid var(--border-soft);
      background: transparent;
      color: var(--muted);
      font-family: var(--font-body);
      font-size: var(--text-sm);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-pill:hover {
      border-color: var(--border);
      color: var(--fg);
    }

    .filter-pill.active {
      background: var(--fg);
      border-color: var(--fg);
      color: var(--bg);
    }

    .portfolio-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: var(--space-4);
    }

    .portfolio-item {
      position: relative;
      aspect-ratio: 4 / 3;
      border-radius: var(--radius-sm);
      overflow: hidden;
      cursor: pointer;
    }

    .portfolio-item.featured {
      grid-column: span 2;
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
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 40%, transparent 60%);
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

    .portfolio-overlay .meta {
      margin-bottom: var(--space-2);
    }

    .portfolio-overlay h3 {
      font-size: var(--text-lg);
      margin-bottom: var(--space-2);
    }

    .item-desc {
      font-size: var(--text-sm);
      color: var(--muted);
      line-height: 1.5;
      max-width: 40ch;
    }

    .empty-state {
      text-align: center;
      padding: 80px 0;
    }

    @media (max-width: 1024px) {
      .portfolio-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .portfolio-item.featured {
        grid-column: span 2;
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

      .portfolio-grid {
        grid-template-columns: 1fr;
      }

      .portfolio-item.featured {
        grid-column: span 1;
      }

      .filters {
        gap: var(--space-2);
        margin-bottom: 32px;
      }

      .filter-pill {
        padding: 8px 16px;
        font-size: var(--text-xs);
      }
    }
  `],
})
export class PortfolioComponent implements OnInit {
  private api = inject(ApiService);

  items = signal<PortfolioItem[]>([]);
  loading = signal(true);
  activeFilter = signal<string>('all');

  filterTabs = [
    { key: 'all', label: 'Все работы' },
    { key: 'gates', label: 'Ворота' },
    { key: 'stairs', label: 'Лестницы' },
    { key: 'canopy', label: 'Навесы' },
    { key: 'fence', label: 'Ограждения' },
    { key: 'frame', label: 'Каркасы' },
  ];

  private categoryMap: Record<string, string> = {
    gates: 'Ворота',
    stairs: 'Лестницы',
    canopy: 'Навесы',
    fence: 'Ограждения',
    frame: 'Каркасы',
  };

  filteredItems = computed(() => {
    const filter = this.activeFilter();
    const all = this.items();
    if (filter === 'all') return all;
    return all.filter(item => item.category === filter);
  });

  ngOnInit(): void {
    this.loadPortfolio();
  }

  setFilter(key: string): void {
    this.activeFilter.set(key);
  }

  getCategoryLabel(category: string): string {
    return this.categoryMap[category] || category;
  }

  private loadPortfolio(): void {
    this.loading.set(true);
    this.api.getPortfolio().subscribe({
      next: (data) => {
        this.items.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
