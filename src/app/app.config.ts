import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';

import { JwtModule } from '@auth0/angular-jwt';
import { HTTP_INTERCEPTORS, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";
import {
  provideCharts,
  withDefaultRegisterables,
} from 'ng2-charts';
import { HttpInterceptorService } from './api/interceptor/http-interceptor.service';
import { environment } from '../environments/environment';
export function tokenGetter() {
  return localStorage.getItem(environment.tokenName);
}




const config: SocketIoConfig = { url: 'wss://test-potatocs-lb.com', options: { transports: ['websocket'], path: '/socket/' } };
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
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true
    },
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    provideCharts(withDefaultRegisterables()),
    provideAnimationsAsync()]
};
