import { Injectable, OnInit } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, ActivatedRoute } from '@angular/router';
import { DialogService } from 'src/app/components/auth/sign-in/dialog/dialog.service';
import { AuthService } from './auth.service';

@Injectable()
export class SignInGuard implements CanActivate, OnInit {

	constructor(
		private router: Router,
		private auth: AuthService,
		private route: ActivatedRoute,
		private dialogService: DialogService
		) {

	}

	ngOnInit() {
		console.log('auth guard oninit');
		console.log(this.route.params)
	}
	
	
	// https://stackoverflow.com/questions/42719445/pass-parameter-into-route-guard
	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
		

		// 토큰 만료 혹은 종료 시 login page로 돌아감.
		const routePath = route.routeConfig?.path;
		if (!this.auth.isAuthenticated()) {
			// console.log('Invalid Token');
			if (routePath == '' || routePath == 'sign-in' || routePath == 'sign-up') {
				return true;
			} else {
				this.dialogService.openDialogNegative('Please login first');
				this.router.navigate(['/sign-in'], {queryParams: {params : state.url} });
			}
		} 
		return true;
	}
}
