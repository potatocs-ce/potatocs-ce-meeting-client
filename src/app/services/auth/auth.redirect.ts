import { Injectable, OnInit } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable()
export class AuthRedirect implements CanActivate, OnInit {

	constructor(private router: Router, private auth: AuthService) { }

	ngOnInit() {
		console.log('auth redirect oninit');
	}

	canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

		const routePath = route.routeConfig?.path;
		if (!this.auth.isAuthenticated()) {
			// console.log('Invalid Token');
			alert('Please login first');
			this.router.navigate(['sign-in']);
			return true;
		} else {
			console.log('auth redirect');
			return true;
			
		}
	}
}
