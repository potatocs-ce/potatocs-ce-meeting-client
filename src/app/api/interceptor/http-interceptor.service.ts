import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MeetingService } from '../../services/meeting/meeting.service';
import { MediasoupService } from '../../services/mediasoup/mediasoup.service';
import { VideoService } from '../../services/video/video.service';
import { MatDialog } from '@angular/material/dialog';
@Injectable({
  providedIn: 'root'
})
export class HttpInterceptorService implements HttpInterceptor {

  constructor(private router: Router, private meetingService: MeetingService, private mediasoupService: MediasoupService, private videoService: VideoService, public dialog: MatDialog) {

  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage: any = '';
        if (error.error instanceof ErrorEvent) {
          // 클라이언트 측 에러
          errorMessage = `Error: ${error.error.message}`;
        } else {
          // 서버 측 에러
          errorMessage = error;
          // 여기서 공통 동작을 수행합니다. 예를 들어:

          if (error.status === 401) {
            // 인증 오류 시 로그인 페이지로 리다이렉션
            this.mediasoupService.exit();
            this.videoService.clearData();
            this.dialog.closeAll();
            this.router.navigate(['/sign-in'], { queryParams: { params: this.meetingService.meeting_room_id() } });
          } else if (error.status === 403) {
            // 인증 오류 시 로그인 페이지로 리다이렉션
            this.mediasoupService.exit();
            this.videoService.clearData();
            this.dialog.closeAll();
            this.router.navigate(['/sign-in'], { queryParams: { params: this.meetingService.meeting_room_id() } });
          }
        }
        return throwError(errorMessage);
      })
    )
  }
}
