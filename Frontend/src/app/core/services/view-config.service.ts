import { Injectable } from '@angular/core';

export interface ViewConfig {
  name: string;
  columns: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ViewConfigService {
  private storageKey = 'historyViewConfigs';
  private maxViews = 10;

  getConfigs(): ViewConfig[] {
    const raw = localStorage.getItem(this.storageKey);
    return raw ? JSON.parse(raw) as ViewConfig[] : [];
  }

  saveConfig(config: ViewConfig): void {
    let configs = this.getConfigs().filter(c => c.name !== config.name);
    configs.unshift(config);
    if (configs.length > this.maxViews) {
      configs = configs.slice(0, this.maxViews);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(configs));
  }

  deleteConfig(name: string): void {
    const configs = this.getConfigs().filter(c => c.name !== name);
    localStorage.setItem(this.storageKey, JSON.stringify(configs));
  }
}
