import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class MeetingService {



    private meetingDataSubject$ = new BehaviorSubject({});
    meetingDAta$ = this.meetingDataSubject$.asObservable();

    private URL = '/apim/v1/';
    constructor(
        private http: HttpClient
    ) { }


    getMeetingData(data: any) {
        console.log(data)
        console.log(data.meetingId)
        return this.http.get('/apim/v1/meetingInfo/' + data.meetingId);
    }

    getUserData(userId: any) {
        console.log(userId)
        console.log(userId)
        return this.http.get('/apim/v1/collab/getUserData/' + userId);
    }

    ////////////////////////////////////////////////////
    // 채팅 생성
    createChat(data) {
        console.log('[API] -----> createChat');
        return this.http.post('/apim/v1/collab/createChat/', data);
    }

    // 채팅 불러오기
    getMeetingChat(meetingId) {
        console.log('[API] -----> getMeetingChat');
        return this.http.get('/apim/v1/collab/getChat/', { params: meetingId });
    }

    // 채팅 삭제
    deleteMeetingChat(chatId) {
        console.log('[API] -----> deleteMeetingChat');
        return this.http.delete('/apim/v1/collab/deleteChat/', { params: chatId });
    }

    // 미팅 삭제 시 DB에 저장된 채팅 삭제
    deleteAllOfChat(data) {
        console.log('[API] -----> deleteAllOfChat');
        return this.http.delete('/apim/v1/collab/deleteAllOfChat/');
    }
    ////////////////////////////////////////////////////


    ////////////////////////////////////////////////////
    // 참여자별 상태 정보 가져오기
    getParticipantState(meetingId) {
        console.log('[API] -----> getParticipantState');
        return this.http.get('/apim/v1/collab/getParticipantState/', { params: meetingId });
    }

    // 참여자별 onLine 유무
    getOnlineTrue(userOnlineData) {
        console.log('[API] -----> getOnlineTrue');
        return this.http.get('/apim/v1/collab/getOnlineTrue/', { params: userOnlineData });
    }

    // 참여자별 onLine 유무
    getOnlineFalse(userOnlineData) {
        console.log('[API] -----> getOnlineFalse');
        return this.http.get('/apim/v1/collab/getOnlineFalse/', { params: userOnlineData });
    }

    // 참여자별 역할 설정
    getRoleUpdate(userRoleData) {
        console.log('[API] -----> getRoleUpdate');
        return this.http.get('/apim/v1/collab/getRoleUpdate/', { params: userRoleData });
    }
    ////////////////////////////////////////////////////


    ////////////////////////////////////////////////////
    // 미팅 status가 Close일 경우 모든 권한 막기
    getMeetingStatus(meetingId) {
        console.log('[API] -----> getMeetingStatus');
        return this.http.get('/apim/v1/collab/getMeetingStatus/', { params: meetingId });
    }

    ////////////////////////////////////////////////////
}
