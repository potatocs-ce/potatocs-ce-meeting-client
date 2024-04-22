import { CanActivateFn } from '@angular/router';

export const meetingGuard: CanActivateFn = (route, state) => {

  return true;
};
