import { routes } from './app.routes';
import { AuthGuard } from './core/guards/auth.guard';

describe('App Routes', () => {
  it('should include advanced shipment tracking route protected by AuthGuard', () => {
    const route = routes.find(r => r.path === 'advanced-shipment-tracking');
    expect(route).toBeTruthy();
    expect(route?.canActivate).toContain(AuthGuard);
  });
});
