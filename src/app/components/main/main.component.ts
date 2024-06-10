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
import { VideoDrawingService } from '../../services/socket/video_drawing/video-drawing.service';
import { DocApiService } from '../../api/doc/doc-api.service';
import { DocumentService } from '../../services/document/document.service';
import { PdfDrawingService } from '../../services/socket/pdf_drawing/pdf-drawing.service';
import { ChatSocketService } from '../../services/socket/chat/chat-socket.service';
import { SurveyApiService } from '../../api/survey/survey-api.service';
import { SurveyService } from '../../services/survey/survey.service';
import { SurveySocketService } from '../../services/socket/survey/survey-socket.service';

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterOutlet,
    ToolbarComponent, MenuComponent,
    PresentComponent, AudienceComponent,
    WhiteboardComponent, DocumentsComponent,
    AudioComponent],
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
    private toggleService: ToggleService,
    @Inject(PLATFORM_ID) private _platform: Object,
    private videoService: VideoService,
    private mediasoupService: MediasoupService,
    private meetingService: MeetingService,
    private meetingServiceApi: MeetingServiceAPI,
    private docSerciceApi: DocApiService,
    private docService: DocumentService,
    private videoDrawingService: VideoDrawingService,
    private pdfDrawingServie: PdfDrawingService,
    private chatSocketService: ChatSocketService,
    private surveyApiService: SurveyApiService,
    private surveyService: SurveyService,
    private surveySocketService: SurveySocketService) {
    effect(() => {
      this.toggle_mode = this.toggleService.toggle_mode();
      this.toggle_video_whiteboard = this.toggleService.toggle_video_whiteboard();
    })

    //
    effect(() => {
      this.audience_video = this.videoService.audienceVideoStream();
    })

    //
    effect(() => {
      this.audioStreams = this.videoService.audioStream();
    })


    effect(async () => {
      if (this.meetingService.meeting_room_id() !== '' && this.meetingService.meeting_room_id() !== undefined) {
        // console.log(this.meetingService.meeting_room_id())
        await this.mediasoupService.joinRoom()
      }
    })

  }

  ngOnInit() {

    this.route.params.subscribe((params: any) => {
      // console.log(params)
      this.meetingService.meeting_room_id.set(params.id)


      // 현재까지의 설문조사 정보 가져오기
      this.surveyApiService.getSurveys(params.id).subscribe((res: any) => {
        this.surveyService.surveys.set(res);
      })

      // meetingId 로 db에 있는 채팅 정보 가져오기
      this.meetingServiceApi.getMeetingChat(params.id).subscribe((res: any) => {
        this.meetingService.meeting_chat_info.set(res)
      })


      // doc 리스트 조회
      this.docSerciceApi.getDocList(params.id).subscribe((res: any) => {
        this.docService.generatePdfData(res);
      })


      // doc 판서 리스트 조회
      this.docSerciceApi.getDrawingList(params.id).subscribe((res: any) => {
        this.docService.generateDrawingData(res);
      })
    });


    if (isPlatformBrowser(this._platform) && 'mediaDevices' in navigator) {
      navigator.mediaDevices.enumerateDevices().then((devices: any) => {
        devices.forEach(async (device: any) => {
          // 오디오 타입인 경우
          if ('audioinput' === device.kind) {
            // 만약 첫 값이면
            if (this.videoService.audioDevices().length == 0) {
              this.videoService.nowAudioId.set(device.deviceId);
            }
            this.videoService.audioDevices.set([...this.videoService.audioDevices(), { label: device.label, deviceId: device.deviceId }])
          }
          // 비디오 타입인 경우
          else if ('videoinput' === device.kind) {
            // 만약 첫 값이면
            if (this.videoService.videoDeivces().length == 0) {
              // 현재 디바이스 넣기
              this.videoService.nowVideoId.set(device.deviceId);
            }
            this.videoService.videoDeivces.set([...this.videoService.videoDeivces(), { label: device.label, deviceId: device.deviceId }])
          }
        })
      })
    }
  }

  async ngAfterViewInit() {
    // await this.mediasoupService.joinRoom()
    this.meetingServiceApi.getVideoDrawings(this.meetingService.meeting_room_id()).subscribe((res: any) => {
      const object = res.reduce((acc: any, value: any, index: any) =>
        ({ ...acc, [value._id]: value.data })
        , {});

      this.videoDrawingService.drawVarArray.set(object)
    })

  }

  //청중 모드에 동영상 추가



}
