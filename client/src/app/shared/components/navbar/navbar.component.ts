import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar">
      <div class="navbar-inner container">
        <a class="logo" routerLink="/">ЗАПАНКОВ</a>

        <ul class="nav-links" [class.open]="menuOpen()">
          <li><a routerLink="/" fragment="services" (click)="closeMenu()">Услуги</a></li>
          <li><a routerLink="/portfolio" routerLinkActive="active" (click)="closeMenu()">Работы</a></li>
          <li><a routerLink="/order" routerLinkActive="active" (click)="closeMenu()">Заявка</a></li>
          <li><a routerLink="/admin" routerLinkActive="active" (click)="closeMenu()">Панель</a></li>
        </ul>

        <a class="cta btn-ghost btn-ghost-sm btn-primary" routerLink="/order">Заказать</a>

        <button
          class="burger"
          [class.open]="menuOpen()"
          (click)="toggleMenu()"
          aria-label="Меню"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.8);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid var(--border-soft);
    }

    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }

    .logo {
      font-family: var(--font-display);
      font-size: var(--text-lg);
      color: var(--fg);
      text-transform: uppercase;
      letter-spacing: var(--tracking-display);
      white-space: nowrap;
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: var(--space-8);
      list-style: none;
      margin: 0;
      padding: 0;

      a {
        font-size: var(--text-sm);
        color: var(--muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        transition: color 0.2s ease;

        &:hover,
        &.active {
          color: var(--fg);
        }
      }
    }

    .cta {
      white-space: nowrap;
    }

    .burger {
      display: none;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 32px;
      height: 32px;
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;

      span {
        display: block;
        width: 100%;
        height: 2px;
        background: var(--fg);
        border-radius: 1px;
        transition: transform 0.3s ease, opacity 0.3s ease;
      }

      &.open span:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }
      &.open span:nth-child(2) {
        opacity: 0;
      }
      &.open span:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }
    }

    @media (max-width: 768px) {
      .nav-links {
        display: none;
        position: fixed;
        top: 64px;
        left: 0;
        right: 0;
        bottom: 0;
        flex-direction: column;
        justify-content: center;
        gap: var(--space-8);
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);

        &.open {
          display: flex;
        }

        a {
          font-size: var(--text-lg);
        }
      }

      .cta {
        display: none;
      }

      .burger {
        display: flex;
      }
    }
  `],
})
export class NavbarComponent {
  menuOpen = signal(false);

  toggleMenu(): void {
    this.menuOpen.update(v => !v);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
