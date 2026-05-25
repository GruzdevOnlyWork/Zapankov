import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <div class="footer-inner container">
        <span class="contacts">+7 (920) 648-71-12 &middot; zapankovegor&#64;mail.ru</span>
      </div>
    </footer>
  `,
  styles: [`
    .footer {
      border-top: 1px solid var(--border-soft);
      padding: var(--space-8) 0;
    }

    .footer-inner {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: var(--space-4);
    }

    .copy,
    .contacts {
      font-size: var(--text-sm);
      color: var(--muted);
      letter-spacing: 0.5px;
    }

    @media (max-width: 600px) {
      .footer-inner {
        flex-direction: column;
        text-align: center;
      }
    }
  `],
})
export class FooterComponent {}
