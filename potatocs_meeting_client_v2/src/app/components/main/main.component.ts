import { Component, Inject, PLATFORM_ID, effect } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { ToolbarComponent } from '../../layout/toolbar/toolbar.component';
import { MenuComponent } from '../../layout/menu/menu.component';
import { AudienceComponent } from '../Audience/audience/audience.component';
import { PresentComponent } from '../present/present.component';
import { WhiteboardComponent } from '../whiteboard/whiteboard.component';
import { DocumentsComponent } from '../documents/documents.component';
import { AudioComponent } from '../audio/audio.component';
import { ToggleService } from '../../services/toggle/toggle.service';
import { VideoService } from '../../services/video/video.service';
import { MediasoupService } from '../../services/mediasoup/mediasoup.service';
import { MeetingService } from '../../services/meeting/meeting.service';
import { MeetingServiceAPI } from '../../api/meeting/meetingAPI.service';

import { DocApiService } from '../../api/doc/doc-api.service';
import { DocumentService } from '../../services/document/document.service';
import { PdfDrawingService } from '../../services/socket/pdf_drawing/pdf-drawing.service';
import { ChatSocketService } from '../../services/socket/chat/chat-socket.service';
import { SurveyApiService } from '../../api/survey/survey-api.service';
import { SurveyService } from '../../services/survey/survey.service';
import { SurveySocketService } from '../../services/socket/survey/survey-socket.service';
import { DeviceCheckComponent } from '../device-check/device-check.component';
import { DrawingService } from '../../services/drawing/drawing.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterOutlet,
    ToolbarComponent, MenuComponent,
    PresentComponent, AudienceComponent,
    WhiteboardComponent, DocumentsComponent,
    AudioComponent, DeviceCheckComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.scss'
})
export class MainComponent {
  title = 'meeting_front';
  toggle_mode: string = '';
  toggle_video_whiteboard: string = '';

  audience_video: Array<any> = [];
  audioStreams: Array<any> = [];

  roomInfo: string = ''; // 방 정보 저장용 변수
  nameInfo: string = '호균-test'; // 이름 정보 저장용 변수




  constructor(
    private router: Router,
    private route: ActivatedRoute,
    public toggleService: ToggleService,
    @Inject(PLATFORM_ID) private _platform: Object,
    private videoService: VideoService,
    public mediasoupService: MediasoupService,
    public meetingService: MeetingService,
    private meetingServiceApi: MeetingServiceAPI,
    private docSerciceApi: DocApiService,
    private docService: DocumentService,

    private pdfDrawingServie: PdfDrawingService,
    private chatSocketService: ChatSocketService,
    private surveyApiService: SurveyApiService,
    private surveyService: SurveyService,
    private surveySocketService: SurveySocketService,
    private drawingService: DrawingService) {
    effect(() => {
      this.toggle_mode = this.toggleService.toggle_mode();
      this.toggle_video_whiteboard = this.toggleService.toggle_video_whiteboard();
    })

    //
    effect(() => {
      this.audience_video = this.meetingService.users_info();
    })

    //
    effect(() => {
      this.audioStreams = this.videoService.audioStream();
    })


    effect(async () => {
      if (this.meetingService.meeting_room_id() !== '' && this.meetingService.meeting_room_id() !== undefined) {

        // await this.mediasoupService.joinRoom()
      }
    })


    effect(() => {
      // socket 연결에 성공 했으면 관련 정보 받아옴
      if (this.mediasoupService.joined()) {
        this.route.params.subscribe((params: any) => {


          // doc 판서 리스트 조회
          this.docSerciceApi.getDrawingList(params.id).subscribe((res: any) => {
            this.docService.generateDrawingData(res);
          })

          // doc 리스트 조회
          this.docSerciceApi.getDocList(params.id).subscribe((res: any) => {
            this.docService.generatePdfData(res);
          })

          // 현재까지의 설문조사 정보 가져오기
          this.surveyApiService.getSurveys(params.id).subscribe((res: any) => {
            this.surveyService.surveys.set(res);
          })


          // pdf 드로잉 모니터링
          this.pdfDrawingServie.monitDrawing();
        })
      }
    })
  }

  ngOnInit() {

    this.route.params.subscribe((params: any) => {
      // console.log(params)
      this.meetingService.meeting_room_id.set(params.id)

      // meetingId 로 db에 있는 채팅 정보 가져오기
      this.meetingServiceApi.getMeetingChat(params.id).subscribe((res: any) => {
        // for (let i = 0; i < res.length; i++) {
        //   for (let j = 0; j < res[i].images.length; j++) {

        //   }
        // }
        this.meetingService.meeting_chat_info.set(res)
      })



      navigator.mediaDevices.addEventListener('devicechange', async event => {
        const devices = await navigator.mediaDevices.enumerateDevices();
        await this.convertDeviceObject(devices)
      });
    });


    // if (isPlatformBrowser(this._platform) && 'mediaDevices' in navigator) {
    //   navigator.mediaDevices.enumerateDevices().then((devices: any) => {
    //     devices.forEach(async (device: any) => {
    //       // 오디오 타입인 경우
    //       if ('audioinput' === device.kind) {
    //         // 만약 첫 값이면
    //         if (this.videoService.audioDevices().length == 0) {
    //           this.videoService.nowAudioId.set(device.deviceId);
    //         }
    //         this.videoService.audioDevices.set([...this.videoService.audioDevices(), { label: device.label, deviceId: device.deviceId }])
    //       }
    //       // 비디오 타입인 경우
    //       else if ('videoinput' === device.kind) {
    //         // 만약 첫 값이면
    //         if (this.videoService.videoDeivces().length == 0) {
    //           // 현재 디바이스 넣기
    //           this.videoService.nowVideoId.set(device.deviceId);
    //         }
    //         this.videoService.videoDeivces.set([...this.videoService.videoDeivces(), { label: device.label, deviceId: device.deviceId }])
    //       }
    //     })
    //   })
    // }
  }


  //청중 모드에 동영상 추가
  async convertDeviceObject(devices: any) {
    // 장치값 초기화


    this.videoService.audioDevices.set([]);

    this.videoService.videoDeivces.set([]);

    this.videoService.speakerDevices.set([]);

    devices.forEach((device: any) => {
      if (device.kind == 'audioinput') {

        this.videoService.audioDevices.set([...this.videoService.audioDevices(), { kind: device.kind, label: device.label, deviceId: device.deviceId }])
      } else if (device.kind == 'videoinput') {

        this.videoService.videoDeivces.set([...this.videoService.videoDeivces(), { kind: device.kind, label: device.label, deviceId: device.deviceId }])
      } else if (device.kind == 'audiooutput') {

        this.videoService.speakerDevices.set([...this.videoService.speakerDevices(), { kind: device.kind, label: device.label, deviceId: device.deviceId }])
      }
    })


    this.videoService.nowAudioId.set(this.videoService.audioDevices()[0]!.deviceId)

    this.videoService.nowVideoId.set(this.videoService.videoDeivces()[0]!.deviceId)

    this.videoService.nowSpeakerId.set(this.videoService.speakerDevices()[0]!.deviceId)
  }


}
