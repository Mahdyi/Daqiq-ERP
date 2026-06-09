import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Injectable,
  PLATFORM_ID,
  Renderer2,
  RendererFactory2,
  computed,
  effect,
  inject,
  signal
} from '@angular/core';

import { ThemeMode, ThemePreference } from './theme.model';
import { DEFAULT_THEME_CONFIG, THEME_STORAGE_KEY } from './theme.tokens';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly config = inject(DEFAULT_THEME_CONFIG);
  private readonly document = inject(DOCUMENT);
  private readonly storageKey = inject(THEME_STORAGE_KEY);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(RendererFactory2).createRenderer(null, null);
  private readonly isBrowser = isPlatformBrowser(this.platformId);
  private readonly colorSchemeQuery = this.createColorSchemeQuery();

  private readonly preferenceState = signal<ThemePreference>(this.getInitialPreference());
  private readonly systemModeState = signal<ThemeMode>(this.readSystemMode());

  readonly preference = this.preferenceState.asReadonly();
  readonly systemMode = this.systemModeState.asReadonly();
  readonly availablePreferences = this.config.availablePreferences;
  readonly density = this.config.density;
  readonly palette = this.config.palette;
  readonly effectiveMode = computed<ThemeMode>(() => {
    const preference = this.preference();

    return preference === 'system' ? this.systemMode() : preference;
  });
  readonly isDarkMode = computed(() => this.effectiveMode() === 'dark');

  constructor() {
    this.listenToSystemPreference();

    effect(() => {
      this.persistPreference(this.preference());
    });

    effect(() => {
      this.applyTheme(this.preference(), this.effectiveMode());
    });
  }

  setPreference(preference: ThemePreference): void {
    if (!this.config.availablePreferences.includes(preference)) {
      return;
    }

    this.preferenceState.set(preference);
  }

  private getInitialPreference(): ThemePreference {
    return this.readStoredPreference() ?? this.config.defaultPreference;
  }

  private readStoredPreference(): ThemePreference | null {
    if (!this.isBrowser) {
      return null;
    }

    try {
      const value = this.document.defaultView?.localStorage.getItem(this.storageKey) ?? null;

      return this.isThemePreference(value) ? value : null;
    } catch {
      return null;
    }
  }

  private persistPreference(preference: ThemePreference): void {
    if (!this.isBrowser) {
      return;
    }

    try {
      this.document.defaultView?.localStorage.setItem(this.storageKey, preference);
    } catch {
      return;
    }
  }

  private createColorSchemeQuery(): MediaQueryList | null {
    if (!this.isBrowser) {
      return null;
    }

    return this.document.defaultView?.matchMedia('(prefers-color-scheme: dark)') ?? null;
  }

  private readSystemMode(): ThemeMode {
    return this.colorSchemeQuery?.matches === true ? 'dark' : 'light';
  }

  private listenToSystemPreference(): void {
    if (!this.colorSchemeQuery) {
      return;
    }

    const listener = (event: MediaQueryListEvent): void => {
      this.systemModeState.set(event.matches ? 'dark' : 'light');
    };

    this.colorSchemeQuery.addEventListener('change', listener);
    this.destroyRef.onDestroy(() => {
      this.colorSchemeQuery?.removeEventListener('change', listener);
    });
  }

  private applyTheme(preference: ThemePreference, effectiveMode: ThemeMode): void {
    const root = this.document.documentElement;
    const body = this.document.body;

    this.setThemeClasses(this.renderer, root, preference, effectiveMode);
    this.renderer.setAttribute(root, 'data-theme', effectiveMode);
    this.renderer.setAttribute(root, 'data-theme-preference', preference);
    this.renderer.setAttribute(root, 'data-theme-density', this.config.density);
    this.renderer.setStyle(root, 'color-scheme', effectiveMode);

    if (body) {
      this.setThemeClasses(this.renderer, body, preference, effectiveMode);
    }
  }

  private setThemeClasses(
    renderer: Renderer2,
    element: HTMLElement,
    preference: ThemePreference,
    effectiveMode: ThemeMode
  ): void {
    renderer.removeClass(element, 'app-light');
    renderer.removeClass(element, 'app-dark');
    renderer.removeClass(element, 'app-theme-system');
    renderer.removeClass(element, 'app-theme-light');
    renderer.removeClass(element, 'app-theme-dark');

    renderer.addClass(element, effectiveMode === 'dark' ? 'app-dark' : 'app-light');
    renderer.addClass(element, `app-theme-${preference}`);
  }

  private isThemePreference(value: string | null): value is ThemePreference {
    return value === 'light' || value === 'dark' || value === 'system';
  }
}
