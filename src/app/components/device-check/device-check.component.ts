import { Component, ElementRef, ViewChild, effect } from '@angular/core';
import { FormBuilder, FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { MeetingService } from '../../services/meeting/meeting.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { VideoService } from '../../services/video/video.service';
import { MediasoupService } from '../../services/mediasoup/mediasoup.service';
import { MatButtonModule } from '@angular/material/button';



@Component({
  selector: 'app-device-check',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatCheckboxModule, FormsModule, MatButtonModule],
  templateUrl: './device-check.component.html',
  styleUrl: './device-check.component.scss'
})
export class DeviceCheckComponent {
  miceDevices: any = []; // 마이크 장치 리스트 
  videoDevices: any = []; // 카메라 리스트
  speakerDevices: any = []; // 스피커 장치 리스트
  devicesInfo: any;
  selectedMiceDevice: any; // 선택된 마이크 장치
  selectedVideoDevice: any; // 선택된 카메라 장치
  selectedSpeakerDevice: any; // 선택된 스피커 장치
  selectedDevices: any;
  audioDeviceExist: boolean = true;
  videoDeviceExist: boolean = true;

  isChecked: any;
  cameraOn: boolean = true;
  cameraOff: boolean = false;

  meetingId: any;
  meetingClose = false;

  browserInfo: any;
  browserVersion: any;
  soundMeterInterval: any;
  localStream$: any;
  soundLevel: any;
  private unsubscribe$ = new Subject<void>();

  @ViewChild('video', { static: true }) public videoRef: ElementRef | any;

  video: any;

  constructor(
    // private eventBusService: EventBusService,
    public fb: FormBuilder,
    // private devicesInfoService: DevicesInfoService,
    private meetingService: MeetingService,
    private route: ActivatedRoute,
    // private webrtcService: WebRTCService,
    private videoService: VideoService,
    private mediasoupService: MediasoupService
  ) {
    // this.localStream$ = this.webrtcService.localStream$;
    effect(() => {

    })
  }

  ngOnInit() {
    this.meetingId = this.route.snapshot.params['id'];

    this.video = this.videoRef.nativeElement;

    // 브라우저 체크
    this.browserCheck();

    // 웹캠으로 부터 스트림 추출
    this.getLocalMediaStream();

    // 컴퓨터에 연결된 장치 목록
    this.deviceCheck();

    // 오디오 스트림 바
    this.extractAudioStream();

    // 컴퓨터에 연결된 장치 추가/제거 시 실시간으로 목록 수정
    this.deviceChangeCheck();
  }

  // 컴퓨터에 연결된 장치 목록
  async deviceCheck() {
    // console.log(this.instantMeter)
    // https://developer.mozilla.org/ko/docs/Web/API/MediaDevices/enumerateDevices
    // https://webrtc.org/getting-started/media-devices#using-promises
    // https://simpl.info/getusermedia/sources/
    // https://levelup.gitconnected.com/share-your-screen-with-webrtc-video-call-with-webrtc-step-5-b3d7890c8747
    await navigator.mediaDevices.enumerateDevices().then(async (devices) => {
      console.log('-------------------- device list ------------------------');
      console.log(devices)
      // 장치 목록 객체화
      this.convertDeviceObject(devices)
      console.log(this.miceDevices)
      console.log(this.videoDevices)
      console.log(this.speakerDevices)
      // 장치 연결, 권한 유무
      this.checkDevice()

      this.selectDevice();
    }).catch(function (err) {
      console.log(err);
    });
  }

  // 컴퓨터에 연결된 장치 추가/제거 시 실시간으로 목록 변경
  deviceChangeCheck() {
    navigator.mediaDevices.addEventListener('devicechange', async event => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      await this.convertDeviceObject(devices)
      this.checkDevice()
      this.selectDevice();
    });
  }


  // 모든 미디어 장치 분리해서 Object로 저장
  convertDeviceObject(devices: any) {
    // 장치값 초기화

    this.miceDevices = []
    this.videoService.audioDevices.set([]);
    this.videoDevices = []
    this.videoService.videoDeivces.set([]);
    this.speakerDevices = []
    this.videoService.speakerDevices.set([]);

    devices.forEach((device: any) => {
      if (device.kind == 'audioinput') {
        this.miceDevices.push({ kind: device.kind, label: device.label, id: device.deviceId });
        this.videoService.audioDevices.set([...this.videoService.audioDevices(), { kind: device.kind, label: device.label, deviceId: device.deviceId }])
      } else if (device.kind == 'videoinput') {
        this.videoDevices.push({ kind: device.kind, label: device.label, id: device.deviceId });
        this.videoService.videoDeivces.set([...this.videoService.videoDeivces(), { kind: device.kind, label: device.label, deviceId: device.deviceId }])
      } else if (device.kind == 'audiooutput') {
        this.speakerDevices.push({ kind: device.kind, label: device.label, id: device.deviceId });
        this.videoService.speakerDevices.set([...this.videoService.speakerDevices(), { kind: device.kind, label: device.label, deviceId: device.deviceId }])
      }
    })

    this.selectedMiceDevice = this.miceDevices[0];
    this.videoService.nowAudioId.set(this.miceDevices[0].deviceId)
    this.selectedVideoDevice = this.videoDevices[0];
    this.videoService.nowVideoId.set(this.videoDevices[0].deviceId)
    this.selectedSpeakerDevice = this.speakerDevices[0];
    this.videoService.nowSpeakerId.set(this.speakerDevices[0].deviceId)
  }

  // 장치의 연결 유무
  checkDevice() {
    this.miceDevices[0].id ? this.audioDeviceExist = true : this.audioDeviceExist = false;
    this.miceDevices[0].id ? this.videoService.audioDeviceExist.set(true) : this.videoService.audioDeviceExist.set(false)
    this.videoDevices[0].id ? this.videoDeviceExist = true : this.videoDeviceExist = false;
    this.videoDevices[0].id ? this.videoService.videoDeviceExist.set(true) : this.videoService.videoDeviceExist.set(false)
  }

  // select 창에서 장치를 선택하거나, 목록이 바뀌었을 경우 실행 
  selectDevice() {
    console.log('-------------demvice Change ---------------')
    this.devicesInfo = {
      selectedVideoDeviceId: this.selectedVideoDevice?.id,
      selectedMiceDeviceId: this.selectedMiceDevice?.id,
      selectedSpeakerDeviceId: this.selectedSpeakerDevice?.id,
      audioDeviceExist: this.audioDeviceExist,
      videoDeviceExist: this.videoDeviceExist
    }


    this.videoService.nowVideoId.set(this.selectedVideoDevice.id);
    this.videoService.nowAudioId.set(this.selectedMiceDevice.id);



    // this.devicesInfoService.setDevicesInfo(this.devicesInfo);
    this.changeMediaStream();

    if (typeof this.video.sinkId !== 'undefined') {
      // this.video.setSinkId(this.selectedSpeakerDevice?.id).then(() => {
      //   console.log('succes speaker device')
      // })
      //   .catch((error: any) => {
      //     console.log(error)
      //   })
    }
  }



  // device check 화면에서 카메라 On / Off 유무
  checkValue(event: any) {
    if (event == false) {
      this.videoDeviceExist = false;
      this.videoService.videoDeviceExist.set(false)
      // web-rtc 컴포넌트에 있는 비디오 스트림 설정 변경
      this.selectDevice();
    } else {
      this.videoDeviceExist = true;
      this.videoService.videoDeviceExist.set(true)
      this.selectDevice();
    }
  }



  // 채널 참가 main component로 이동
  async joinMeetingRoom() {
    // this.eventBusService.emit(new EventData('join', ''));
    // this.eventBusService.emit(new EventData('deviceCheck', ''))

    // 지금 stream 데이터 종료
    const stream = this.video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(function (track: any) {

      track.stop()
    })

    await this.mediasoupService.joinRoom();

    this.meetingService.device_check.set(true);
  }

  // video에 스트림 추출
  async getLocalMediaStream() {
    // const options = {
    //     audio: {
    //         'echoCancellation': true,
    //         'noiseSuppression': true,
    //         deviceId: this.selectedMiceDevice?.id
    //     },
    //     video: {
    //         deviceId: this.selectedVideoDevice?.id,
    //         width: 320,
    //         framerate: { max: 24, min: 24 }
    //     }
    // };
    const options = {
      audio:
        this.audioDeviceExist ? {
          'echoCancellation': true,
          'noiseSuppression': true,
          deviceId: this.selectedMiceDevice?.id,
        } : false,
      video: this.videoDeviceExist ? {
        deviceId: this.selectedVideoDevice?.id,
        width: 320,
        framerate: { max: 24, min: 24 }
      } : false
    };
    try {
      // await this.webrtcService.getMediaStream(options);
      const stream = await navigator.mediaDevices.getUserMedia(options);

      this.video.srcObject = stream;


      // 브라우저가 장치의 권한 부여 시 목록 수정
      this.deviceCheck();
    } catch (e) {
      console.log(e);
    }
  }

  // select에서 장치 변경 시 stream 변경
  // 권한 확인 유무 관련해서 이슈때문에 change시 새로운 함수 사용
  async changeMediaStream() {
    // const options = { audio: true, video: true };
    const options = {
      audio:
        this.audioDeviceExist ? {
          'echoCancellation': true,
          'noiseSuppression': true,
          deviceId: this.selectedMiceDevice?.id,
        } : false,
      video: this.videoDeviceExist ? {
        deviceId: this.selectedVideoDevice?.id,
        width: 320,
        framerate: { max: 24, min: 24 }
      } : false
    };

    try {
      // await this.webrtcService.getMediaStream(options);
      const stream = await navigator.mediaDevices.getUserMedia(options);

      this.video.srcObject = stream;


    } catch (e) {
      console.log(e);
    }
  }

  async extractAudioStream() {
    const constraints = {
      audio: true,
      video: false
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(res => this.handleSuccess(res))
      .then(result => this.deviceCheck())
      .catch(error => this.handleError(error));

  }

  handleSuccess(stream: any) {
    // Put variables in global scope to make them available to the
    // browser console.
    const AudioContext = window.AudioContext
    let audioContext = new AudioContext();
    // const soundMeter = new SoundMeter(audioContext);

    const that = this;
    // soundMeter.connectToSource(stream, function (e) {

    //     if (e) {
    //         alert(e);
    //         return;
    //     }
    //     that.soundMeterInterval = setInterval(() => {
    //         (<HTMLInputElement>document.getElementById("instantMeter")).value = soundMeter.slow.toFixed(2);
    //     }, 10);
    // });


  }

  handleError(error: any) {
    console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
  }

  // 브라우저 체크
  browserCheck() {
    var userAgent: any = navigator.userAgent;
    var reg: any = null;
    var browser: any = {
      name: null,
      version: null
    };

    userAgent = userAgent.toLowerCase();

    if (userAgent.indexOf("opr") !== -1) {
      reg = /opr\/(\S+)/;
      browser.name = "Opera";
      // browser.version = reg.exec(userAgent)[1];
      browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));

    } else if (userAgent.indexOf("edge") !== -1) {
      reg = /edge\/(\S+)/;
      browser.name = "Edge";
      browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));
    } else if (userAgent.indexOf("chrome") !== -1) {
      reg = /chrome\/(\S+)/;
      browser.name = "Chrome";
      browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));
    } else if (userAgent.indexOf("safari") !== -1) {
      reg = /safari\/(\S+)/;
      browser.name = "Safari";
      browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));
    } else if (userAgent.indexOf("firefox") !== -1) {
      reg = /firefox\/(\S+)/;
      browser.name = "Firefox";
      browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));
    } else if (userAgent.indexOf("trident") !== -1) {
      browser.name = "IE";

      if (userAgent.indexOf("msie") !== -1) {
        reg = /msie (\S+)/;
        browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));
        browser.version = browser.version.replace(";", "");
      } else {
        reg = /rv:(\S+)/;
        browser.version = reg.exec(userAgent)[1].substring(0, reg.exec(userAgent)[1].indexOf('.'));
      }
    }

    return this.browserInfo = browser;
  }

  ngOnDestroy() {
    clearInterval(this.soundMeterInterval);
    // unsubscribe all subscription
    this.unsubscribe$.next();
    this.unsubscribe$.complete();
    navigator.mediaDevices.removeEventListener('devicechange', async event => {
      const devices = await navigator.mediaDevices.enumerateDevices();
      await this.convertDeviceObject(devices)
      this.checkDevice()
      this.selectDevice();
    });
  }
}



// function SoundMeter(context: any) {
//   this.context = context;
//   this.instant = 0.0;
//   this.slow = 0.0;
//   this.script = context.createScriptProcessor(2048, 1, 1);
//   const that = this;
//   this.script.onaudioprocess = function (event) {
//     const input = event.inputBuffer.getChannelData(0);
//     let i;
//     let sum = 0.0;
//     let clipcount = 0;
//     for (i = 0; i < input.length; ++i) {
//       sum += input[i] * input[i];
//       if (Math.abs(input[i]) > 0.99) {
//         clipcount += 1;
//       }
//     }
//     that.instant = (Math.sqrt(sum / input.length)) * 3;
//     that.slow = 0.7 * that.slow + 0.3 * that.instant;
//   };
// }

// SoundMeter.prototype.connectToSource = function (stream, callback) {
//   console.log('SoundMeter connecting');
//   try {
//     this.mic = this.context.createMediaStreamSource(stream);
//     this.mic.connect(this.script);
//     // necessary to make sample run, but should not be.
//     this.script.connect(this.context.destination);
//     if (typeof callback !== 'undefined') {
//       callback(null);
//     }
//   } catch (e) {
//     console.error(e);
//     if (typeof callback !== 'undefined') {
//       callback(e);
//     }
//   }
// }
