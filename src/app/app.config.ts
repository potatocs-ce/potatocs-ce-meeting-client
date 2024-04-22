import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';
import { provideHttpClient } from '@angular/common/http';
import { JwtModule } from '@auth0/angular-jwt';
import { environment } from './environments/environment';


export function tokenGetter() {
  return localStorage.getItem(environment.tokenName);
}

const config: SocketIoConfig = { url: 'ws://localhost:3000/', options: { transports: ['websocket'], path: '/socket/' } };
export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      JwtModule.forRoot({
        config: {
          tokenGetter: tokenGetter,
          allowedDomains: [
            environment.localhostUrl,
            environment.apiUrl,
            // environment.companyUrl,
            // environment.domain,
          ],
          disallowedRoutes: ['/api/v1/auth/signIn', '/api/v1/auth/signUp'],
        },
      }),
      SocketIoModule.forRoot(config),

    ),
    provideRouter(routes), provideHttpClient(), provideAnimationsAsync()]
};
