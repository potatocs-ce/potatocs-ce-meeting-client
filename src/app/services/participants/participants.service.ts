import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ParticipantsService {
  // 스트림. 스트림은 업로드된 정보를 저장하는곳.
  private participantsSubject = new BehaviorSubject({});
  // asObservable()를 사용해 스트림에 마지막으로 저장된 곳을 가리킴.
  participants = this.participantsSubject.asObservable();

  private userNameSubject = new BehaviorSubject({});
  userName = this.userNameSubject.asObservable();

  private screenStreamSubject = new BehaviorSubject({});
  screenStream = this.screenStreamSubject.asObservable();

  private videoSubject = new BehaviorSubject({});
  video = this.videoSubject.asObservable();

  constructor() { }

  updateParticipantsDocPage(data) {
    if (this.participants.docPage === data.docPage)
      this.participantsSubject.next(data);

  }

  updateParticipants(data) {
    this.participantsSubject.next(data);
  }

  updateUserName(userName) {
    this.participantsSubject.next(userName);
  }

  updateScreenStream(screenStream) {
    this.screenStreamSubject.next(screenStream);
  }

  updateMyVideo(video) {
    this.videoSubject.next(video);
  }
}
