import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { lastValueFrom } from 'rxjs';


import { MeetingServiceAPI } from '../api/meeting/meetingAPI.service';
import { MeetingService } from '../services/meeting/meeting.service';
import { AuthService } from '../services/auth/auth.service';
import { UserService } from '../api/user/user.service';

export const meetingGuard: CanActivateFn = async (route, state) => {
  const meetingApiService = inject(MeetingServiceAPI)
  const meetingService = inject(MeetingService)
  const authService = inject(AuthService)
  const userService = inject(UserService)


  try {
    const meetingInfo: any = await lastValueFrom(meetingApiService.getMeetingInfo(route.params['id'])).catch((err) => {
      // meetingInfo 를 받아올 수 없으면 이전 페이지로 돌려버림
      window.history.back()
    })

    const userId = authService.getTokenInfo()._id;

    if (userId) {
      // const data = await 
      const userInfo: any = await userService.getUserInfo(userId).toPromise();

      meetingInfo.userData = userInfo.userData;

      meetingService.meeting_info.set(meetingInfo);

      if (meetingInfo.status == 'pending') {
        console.log('회의가 열리지 않았습니다. ')
      }

      const index = meetingInfo.enlistedMembers.findIndex((item: any) =>
        item._id == userId
      )




      // 찾아 봤는데 없으면
      if (index < 0) {
        console.log('권한이 없습니다');

      } else {
        return true;
      }

    } else {
      console.log('로그인을 먼저 해 주세요')
    }
  } catch (err) {
    console.error(err)
  }

  return true;
};
