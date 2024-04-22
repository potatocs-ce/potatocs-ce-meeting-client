import { Routes } from '@angular/router';
import { authGuard } from './services/auth/auth.guard';
import { SignInComponent } from './components/auth/sign-in/sign-in.component';
import { MainComponent } from './components/main/main.component';

export const routes: Routes = [
    {
        path: '',
        component: MainComponent,
        canActivate: [authGuard]
    },
    {
        path: 'sign-in',
        component: SignInComponent
    }
];
