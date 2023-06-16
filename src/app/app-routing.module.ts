import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SignInComponent } from './components/auth/sign-in/sign-in.component';
import { MainComponent } from './components/main/main.component';
import { SignInGuard } from './services/auth/signIn.guard';
import { MeetingGuard } from './services/meeting/auth/meeting.guard';

const routes: Routes = [

	{
		path: '',
		component: MainComponent,
		canActivate: [SignInGuard, MeetingGuard] 
	},

	{
		path: 'sign-in',
		component: SignInComponent
	},

	{
		path: 'room/:id',
		component: MainComponent,
		canActivate: [SignInGuard, MeetingGuard] 
	},
	// 잘못된 URL을 사용했을때 메인으로 보냄
    {
        path: '**',
        redirectTo: '',
        pathMatch: 'full'
    },

];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }
