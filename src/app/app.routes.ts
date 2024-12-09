import { Routes } from '@angular/router';
import { authGuard } from './guard/auth.guard';
import { SignInComponent } from './components/auth/sign-in/sign-in.component';
import { MainComponent } from './components/main/main.component';
import { meetingGuard } from './guard/meeting.guard';


export const routes: Routes = [

    {
        path: 'sign-in',
        component: SignInComponent,
        canActivate: [authGuard]
    },
    {
        path: ':id',
        component: MainComponent,
        canActivate: [authGuard, meetingGuard]
    },
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    },
];
