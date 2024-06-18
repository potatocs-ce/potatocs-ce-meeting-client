import { Routes } from '@angular/router';
import { authGuard } from './services/auth/auth.guard';
import { SignInComponent } from './components/auth/sign-in/sign-in.component';
import { MainComponent } from './components/main/main.component';
import { meetingGuard } from './services/meeting/meeting.guard';

export const routes: Routes = [

    {
        path: 'sign-in',
        component: SignInComponent,
        canActivate: [authGuard]
    },
    {
        path: 'room/:id',
        component: MainComponent,
        canActivate: [authGuard, meetingGuard]
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    },
];
