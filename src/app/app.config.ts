import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { SocketIoConfig, SocketIoModule } from 'ngx-socket-io';

const config: SocketIoConfig = { url: 'ws://localhost:3000/', options: { transports: ['websocket'], path: '/socket/' } };
export const appConfig: ApplicationConfig = {
  providers: [importProvidersFrom(SocketIoModule.forRoot(config)), provideRouter(routes), provideAnimationsAsync()]
};
