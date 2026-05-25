import { Component, signal, inject, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  template: `
    <header class="page-header">
      <h1>Галерея</h1>
      <div class="header-actions">
        <button class="btn-ghost" (click)="openAddModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/></svg>
          Добавить работу
        </button>
      </div>
    </header>

    <div class="gallery-grid">
      @for (item of items(); track item.id; let i = $index) {
        <div class="gallery-card">
          <div class="gallery-image" [style.background-image]="item.imageUrl ? 'url(' + item.imageUrl + ')' : ''">
            @if (!item.imageUrl) {
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
            }
            @if (item.featured) {
              <span class="featured-badge">Featured</span>
            }
          </div>
          <div class="gallery-card-body">
            <h3>{{ item.title }}</h3>
            <div class="gallery-meta">
              <span>{{ getCategoryName(item.category) }}</span>
              @if (item.year) {
                <span>{{ item.year }}</span>
              }
            </div>
          </div>
          <div class="gallery-card-actions">
            <button class="row-action" title="Вверх" (click)="moveUp(i)" [disabled]="i === 0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button class="row-action" title="Вниз" (click)="moveDown(i)" [disabled]="i === items().length - 1">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <button class="row-action" title="Редактировать" (click)="openEditModal(item)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            </button>
            <button class="row-action" title="Удалить" (click)="deleteItem(item)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
            </button>
          </div>
        </div>
      } @empty {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
          <h3>Галерея пуста</h3>
          <p>Добавьте работы в портфолио</p>
        </div>
      }
    </div>

    <div class="overlay" [class.open]="modalOpen()" (click)="closeModal()"></div>

    <div class="detail-panel" [class.open]="modalOpen()">
      <div class="detail-panel-header">
        <h2>{{ editingItem() ? 'Редактировать' : 'Новая работа' }}</h2>
        <button class="detail-panel-close" (click)="closeModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="detail-panel-content">
        <div class="form-group">
          <label class="form-label">Название</label>
          <input type="text" class="form-input" [value]="formTitle()" (input)="formTitle.set(asValue($event))" />
        </div>
        <div class="form-group">
          <label class="form-label">Категория</label>
          <select class="form-select" [value]="formCategory()" (change)="formCategory.set(asValue($event))">
            <option value="gates">Ворота</option>
            <option value="stairs">Лестница</option>
            <option value="canopy">Навес</option>
            <option value="fence">Ограждение</option>
            <option value="frame">Каркас</option>
            <option value="other">Другое</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Описание</label>
          <textarea class="form-input form-textarea" [value]="formDescription()" (input)="formDescription.set(asTextareaValue($event))"></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Локация</label>
          <input type="text" class="form-input" [value]="formLocation()" (input)="formLocation.set(asValue($event))" />
        </div>
        <div class="form-group">
          <label class="form-label">Год</label>
          <input type="number" class="form-input" [value]="formYear()" (input)="formYear.set(+asValue($event))" />
        </div>
        <div class="form-group">
          <label class="checkbox-item" [class.checked]="formFeatured()" (click)="toggleFeatured()">
            <span class="checkbox-box">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <span class="checkbox-label">Показывать на главной</span>
          </label>
        </div>

        <div class="form-group">
          <label class="form-label">Изображение</label>
          @if (formImageUrl()) {
            <div class="image-preview" [style.background-image]="'url(' + formImageUrl() + ')'"></div>
          }
          <div class="image-tabs">
            <button class="image-tab" [class.active]="imageMode() === 'url'" (click)="imageMode.set('url')">По ссылке</button>
            <button class="image-tab" [class.active]="imageMode() === 'file'" (click)="imageMode.set('file')">С компьютера</button>
          </div>
          @if (imageMode() === 'url') {
            <input type="url" class="form-input" placeholder="https://..." [value]="formImageUrl()" (input)="formImageUrl.set(asValue($event))" />
          } @else {
            <input type="file" class="file-input" accept="image/*" (change)="onFileSelect($event)" />
            @if (uploading()) {
              <div class="upload-progress">Загрузка...</div>
            }
          }
        </div>
      </div>
      <div class="detail-panel-footer">
        <button class="btn-ghost btn-primary" (click)="saveItem()" [disabled]="uploading()">
          {{ editingItem() ? 'Сохранить' : 'Создать' }}
        </button>
        <button class="btn-ghost" (click)="closeModal()">Отмена</button>
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
    }
    .btn-ghost:hover { background: rgba(240, 240, 250, 0.2); }
    .btn-ghost:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-ghost svg { width: 16px; height: 16px; }
    .btn-ghost.btn-primary {
      background: var(--fg);
      border-color: var(--fg);
      color: var(--bg);
    }
    .btn-ghost.btn-primary:hover { background: var(--accent-hover); }

    .gallery-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: var(--space-5);
    }
    .gallery-card {
      background: var(--border-soft);
      border: 1px solid var(--border-soft);
      overflow: hidden;
      transition: border-color 0.2s ease;
    }
    .gallery-card:hover { border-color: var(--border); }

    .gallery-image {
      width: 100%;
      height: 200px;
      background: rgba(240, 240, 250, 0.05);
      display: flex;
      align-items: center;
      justify-content: center;
      background-size: cover;
      background-position: center;
      position: relative;
    }
    .gallery-image svg {
      width: 48px;
      height: 48px;
      color: var(--muted);
      opacity: 0.3;
    }
    .featured-badge {
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      padding: 2px 8px;
      background: var(--fg);
      color: var(--bg);
      font-size: var(--text-xs);
      letter-spacing: 0.5px;
      text-transform: uppercase;
      border-radius: var(--radius-sm);
    }

    .gallery-card-body {
      padding: var(--space-4);
    }
    .gallery-card-body h3 {
      font-family: var(--font-display);
      font-size: 14px;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      margin: 0 0 var(--space-2);
    }
    .gallery-meta {
      display: flex;
      gap: var(--space-3);
      font-size: var(--text-sm);
      color: var(--muted);
    }

    .gallery-card-actions {
      display: flex;
      gap: var(--space-1);
      padding: var(--space-3) var(--space-4);
      border-top: 1px solid var(--border-soft);
    }
    .row-action {
      padding: var(--space-2);
      color: var(--muted);
      border-radius: var(--radius-sm);
      transition: all 0.15s ease;
      background: none;
      border: none;
      cursor: pointer;
    }
    .row-action:hover { background: var(--border-soft); color: var(--fg); }
    .row-action:disabled { opacity: 0.3; cursor: not-allowed; }
    .row-action svg { width: 16px; height: 16px; }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
      margin-bottom: var(--space-4);
    }
    .form-label {
      font-size: var(--text-sm);
      color: var(--muted);
      letter-spacing: 0.5px;
    }
    .form-input {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      background: var(--bg);
      border: 1px solid var(--border-soft);
      color: var(--fg);
      font-family: var(--font-body);
      font-size: 14px;
      transition: border-color 0.15s ease;
    }
    .form-input:focus { outline: none; border-color: var(--border); }
    .form-textarea {
      min-height: 100px;
      resize: vertical;
    }
    .form-select {
      width: 100%;
      padding: var(--space-3) var(--space-4);
      background: var(--bg);
      border: 1px solid var(--border-soft);
      color: var(--fg);
      font-family: var(--font-body);
      font-size: 14px;
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='rgba(240,240,250,0.5)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 40px;
      transition: border-color 0.15s ease;
    }
    .form-select:focus { outline: none; border-color: var(--border); }

    .checkbox-item {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      cursor: pointer;
    }
    .checkbox-box {
      width: 18px;
      height: 18px;
      border: 1px solid var(--border);
      border-radius: 3px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.15s ease;
      flex-shrink: 0;
    }
    .checkbox-item.checked .checkbox-box {
      background: var(--fg);
      border-color: var(--fg);
    }
    .checkbox-box svg {
      width: 12px;
      height: 12px;
      color: var(--bg);
      opacity: 0;
    }
    .checkbox-item.checked .checkbox-box svg { opacity: 1; }
    .checkbox-label {
      font-size: 14px;
      color: var(--muted);
    }
    .checkbox-item.checked .checkbox-label { color: var(--fg); }

    .image-tabs {
      display: flex;
      gap: 1px;
      background: var(--border-soft);
      margin-bottom: var(--space-2);
    }
    .image-tab {
      flex: 1;
      padding: var(--space-2) var(--space-3);
      background: var(--bg);
      border: none;
      color: var(--muted);
      font-size: var(--text-sm);
      cursor: pointer;
      transition: all 0.15s ease;
      font-family: inherit;
    }
    .image-tab.active {
      background: var(--border-soft);
      color: var(--fg);
    }

    .file-input {
      font-size: 14px;
      color: var(--muted);
    }
    .file-input::file-selector-button {
      padding: var(--space-2) var(--space-4);
      background: var(--border-soft);
      border: 1px solid var(--border);
      border-radius: var(--radius-pill);
      color: var(--fg);
      font-size: var(--text-sm);
      cursor: pointer;
      margin-right: var(--space-3);
    }
    .image-preview {
      width: 100%;
      height: 150px;
      background-size: cover;
      background-position: center;
      background-color: rgba(240, 240, 250, 0.05);
      margin-bottom: var(--space-2);
    }
    .upload-progress {
      font-size: var(--text-sm);
      color: var(--muted);
    }

    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 150;
    }
    .overlay.open { opacity: 1; visibility: visible; }

    .detail-panel {
      position: fixed;
      top: 0;
      right: 0;
      width: 480px;
      max-width: 100vw;
      height: 100vh;
      background: var(--bg);
      border-left: 1px solid var(--border-soft);
      transform: translateX(100%);
      transition: transform 0.3s ease;
      z-index: 200;
      display: flex;
      flex-direction: column;
    }
    .detail-panel.open { transform: translateX(0); }
    .detail-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-5);
      border-bottom: 1px solid var(--border-soft);
    }
    .detail-panel-header h2 {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      text-transform: uppercase;
      letter-spacing: 0.02em;
      line-height: 1;
      margin: 0;
    }
    .detail-panel-close {
      padding: var(--space-2);
      color: var(--muted);
      background: none;
      border: none;
      cursor: pointer;
    }
    .detail-panel-close:hover { color: var(--fg); }
    .detail-panel-close svg { width: 20px; height: 20px; }
    .detail-panel-content {
      flex: 1;
      overflow-y: auto;
      padding: var(--space-5);
    }
    .detail-panel-footer {
      padding: var(--space-5);
      border-top: 1px solid var(--border-soft);
      display: flex;
      gap: var(--space-3);
    }
    .detail-panel-footer .btn-ghost {
      flex: 1;
      justify-content: center;
    }

    .empty-state {
      grid-column: 1 / -1;
      text-align: center;
      padding: var(--space-8) var(--space-4);
      color: var(--muted);
    }
    .empty-state svg {
      width: 48px;
      height: 48px;
      margin: 0 auto var(--space-4);
      opacity: 0.5;
      display: block;
    }
    .empty-state h3 {
      font-family: var(--font-display);
      font-size: var(--text-base);
      margin: 0 0 var(--space-2);
      color: var(--fg);
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }
    .empty-state p { margin: 0; }
  `],
})
export class GalleryComponent implements OnInit {
  private api = inject(ApiService);

  items = signal<any[]>([]);
  modalOpen = signal(false);
  editingItem = signal<any | null>(null);
  uploading = signal(false);

  formTitle = signal('');
  formCategory = signal('gates');
  formDescription = signal('');
  formLocation = signal('');
  formYear = signal(new Date().getFullYear());
  formFeatured = signal(false);
  formImageUrl = signal('');
  imageMode = signal<'url' | 'file'>('url');

  private categoryMap: Record<string, string> = {
    gates: 'Ворота',
    stairs: 'Лестница',
    canopy: 'Навес',
    fence: 'Ограждение',
    frame: 'Каркас',
    other: 'Другое',
  };

  ngOnInit(): void {
    this.loadItems();
  }

  loadItems(): void {
    this.api.getPortfolio().subscribe({
      next: (data) => this.items.set(data),
      error: () => {},
    });
  }

  getCategoryName(cat: string): string {
    return this.categoryMap[cat] || cat || 'Другое';
  }

  openAddModal(): void {
    this.editingItem.set(null);
    this.formTitle.set('');
    this.formCategory.set('gates');
    this.formDescription.set('');
    this.formLocation.set('');
    this.formYear.set(new Date().getFullYear());
    this.formFeatured.set(false);
    this.formImageUrl.set('');
    this.imageMode.set('url');
    this.modalOpen.set(true);
  }

  openEditModal(item: any): void {
    this.editingItem.set(item);
    this.formTitle.set(item.title || '');
    this.formCategory.set(item.category || 'gates');
    this.formDescription.set(item.description || '');
    this.formLocation.set(item.location || '');
    this.formYear.set(item.year || new Date().getFullYear());
    this.formFeatured.set(item.featured || false);
    this.formImageUrl.set(item.imageUrl || '');
    this.imageMode.set('url');
    this.modalOpen.set(true);
  }

  closeModal(): void {
    this.modalOpen.set(false);
    this.editingItem.set(null);
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.api.uploadImage(file).subscribe({
      next: (res) => {
        this.formImageUrl.set(res.url);
        this.uploading.set(false);
      },
      error: () => this.uploading.set(false),
    });
  }

  saveItem(): void {
    const data = {
      title: this.formTitle(),
      category: this.formCategory(),
      description: this.formDescription(),
      location: this.formLocation(),
      year: this.formYear(),
      featured: this.formFeatured(),
      imageUrl: this.formImageUrl(),
    };

    const editing = this.editingItem();
    if (editing) {
      this.api.updatePortfolioItem(editing.id, data).subscribe({
        next: () => {
          this.closeModal();
          this.loadItems();
        },
        error: () => {},
      });
    } else {
      this.api.createPortfolioItem(data).subscribe({
        next: () => {
          this.closeModal();
          this.loadItems();
        },
        error: () => {},
      });
    }
  }

  deleteItem(item: any): void {
    if (confirm('Удалить работу из галереи?')) {
      this.api.deletePortfolioItem(item.id).subscribe({
        next: () => this.loadItems(),
        error: () => {},
      });
    }
  }

  moveUp(index: number): void {
    if (index === 0) return;
    const list = [...this.items()];
    [list[index - 1], list[index]] = [list[index], list[index - 1]];
    this.items.set(list);
    this.saveSortOrder(list);
  }

  moveDown(index: number): void {
    const list = [...this.items()];
    if (index >= list.length - 1) return;
    [list[index], list[index + 1]] = [list[index + 1], list[index]];
    this.items.set(list);
    this.saveSortOrder(list);
  }

  private saveSortOrder(list: any[]): void {
    list.forEach((item, i) => {
      this.api.updatePortfolioItem(item.id, { sortOrder: i }).subscribe();
    });
  }

  toggleFeatured(): void {
    this.formFeatured.update(v => !v);
  }

  asValue(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }

  asTextareaValue(event: Event): string {
    return (event.target as HTMLTextAreaElement).value;
  }
}
