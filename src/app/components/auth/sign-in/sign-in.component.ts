import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth.service';
import { UserService } from '../../../api/user/user.service';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { DialogService } from '../../../services/dialog/dialog.service';

interface LoginFormData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-sign-in',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule, FormsModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss'
})
export class SignInComponent {
  params: any;

  form: FormGroup;

  signInFormData: LoginFormData = {
    email: '',
    password: '',
  }

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private userService: UserService,
    private fb: FormBuilder,
    private dialogService: DialogService,
  ) {
    this.form = this.fb.group(
      {
        email: ['', [
          Validators.required,
          Validators.email
        ]],
        password: ['', [
          Validators.required,
          Validators.minLength(4),
          Validators.minLength(15)
        ]],
      },
    );
  }


  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.params = params;
    });
  }

  get f() {
    return this.form.controls;
  }

  signIn() {

    this.userService.signIn(this.signInFormData).subscribe(
      (data: any) => {
        if (data.message != null && data.message != '') {
          console.log(data.message);
        }
        // alert('successfully signed in');

        // this.router.navigateByUrl(this.params.params)
        console.log('머선일이구')
        this.router.navigate([`/${this.params.params}`]);
      },
      (err: any) => {
        console.log(err);
        this.errorAlert(err.error.message);
      }
    )
  }

  errorAlert(err: any) {
    switch (err) {
      case 'not found':
        this.dialogService.openDialogNegative('The email does not exist. Try again.');
        break;
      case 'mismatch':
        this.dialogService.openDialogNegative('Password is incorrect. Try again.');
        break;
      case 'retired':
        this.dialogService.openDialogNegative(`An employee who's retired at the company.`);
        break;
    }
  };
}
