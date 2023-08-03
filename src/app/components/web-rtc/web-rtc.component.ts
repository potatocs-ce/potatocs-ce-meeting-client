import { AfterViewInit, Component, ElementRef, Injectable, NgModule, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { pluck, Subject, takeUntil } from 'rxjs';

import adapter from 'webrtc-adapter';
import { SocketioService } from '../../services/socketio/socketio.service';
import { WebRTCService } from '../../services/webRTC/web-rtc.service';
import { WebRtcPeer } from 'kurento-utils';
import { io, Socket } from 'socket.io-client';
import { ParticipantsService } from 'src/app/services/participants/participants.service';
import { EventBusService } from 'src/@wb/services/eventBus/event-bus.service';
import { ActivatedRoute } from '@angular/router';
import { MeetingInfoService } from 'src/@wb/store/meeting-info.service';
import { DevicesInfoService } from 'src/@wb/store/devices-info.service';
import { EventData } from 'src/@wb/services/eventBus/event.class';
import { MeetingService } from 'src/app/services/meeting/meeting.service';




@Component({
  selector: 'app-web-rtc',
  templateUrl: './web-rtc.component.html',
  styleUrls: ['./web-rtc.component.scss']
})
export class WebRTCComponent implements OnInit {
  roomName: any;
  meetingId: any;

  userName: any;
  otherName: any;

  userId: any;
  name: any;
  userData: any;

  myName: any;
  participantsName: any;
  screenStream: any;
  //   private socket: Socket;
  public localStream$;
  private socket;
  participants: any = {};
  // stream: any;
  private unsubscribe$ = new Subject<void>();
  localStream: any;
  bitrate: any;
  streamConstraints: any;
  muted = false;
  cameraOff = false;
  sharing = false;
  constraints: any = {};
  audioDeviceExist = true;
  videoDeviceExist = true;
  videoConstraints: any;
  whiteBoardMode = false // whiteBoard Mode Check
  options: any;
  meetingInfo;
  meetingStatus = false;
  speakerDeviceId: any;
  miceDeviceId: any;
  // webRTC 비디오 오버레이
  hiddenVideoMode = false;
  dragOn = true;
  currentMembersCount: any;
  mobileWidth: any;



  @ViewChild('call') public callRef: ElementRef;
  get call(): HTMLDivElement {
    return this.callRef.nativeElement;
  }
  @ViewChild('muteBtn') public muteBtnRef: ElementRef;
  get muteBtn(): HTMLButtonElement {
    return this.muteBtnRef.nativeElement;
  }
  @ViewChild('cameraBtn') public cameraBtnRef: ElementRef;
  get cameraBtn(): HTMLButtonElement {
    return this.cameraBtnRef.nativeElement;
  }
  @ViewChild('sharingBtn') public sharingBtnRef: ElementRef;
  get sharingBtn(): HTMLButtonElement {
    return this.sharingBtnRef.nativeElement;
  }
  @ViewChild('settingBtn') public settingBtnRef: ElementRef;
  get settingBtn(): HTMLButtonElement {
    return this.settingBtnRef.nativeElement;
  }
  @ViewChild('leaveBtn') public leaveBtnRef: ElementRef;
  get leaveBtn(): HTMLButtonElement {
    return this.leaveBtnRef.nativeElement;
  }
  @ViewChild('video') public videoRef: ElementRef;
  get video(): HTMLVideoElement {
    return this.videoRef.nativeElement;
  }

  @ViewChildren('participants') public participantsRef: QueryList<ElementRef>;
  get participantsElement(): HTMLDivElement {
    return this.participantsRef.last.nativeElement;
  }



  constructor(
    private wetRtcService: WebRTCService,
    private socketService: SocketioService,
    private participantsService: ParticipantsService,
    private eventBusService: EventBusService,
    private route: ActivatedRoute,
    private meetingInfoService: MeetingInfoService,
    private devicesInfoService: DevicesInfoService,
    private meetingService: MeetingService,
  ) {
    this.socket = socketService.socket;
    // this.localStream$ = this.wetRtcService.localStream$;

  }

  ngOnInit(): void {
    // step1: socket connection & join Room & register socket listener
    // todo: disconnect, reconnect를 위한 루틴 추가 필요
    this.registerSocketListener();


    this.mobileWidth = window.screen.width;
  }

  /**
       * 1. Socket Listener 등록
       *  실제로는 listener 해제도 추가해야함.
       */
  private registerSocketListener() {

    this.meetingInfoService.state$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((meetingInfo) => {
        if (meetingInfo) {

          this.meetingInfo = meetingInfo;

          const userData = {
            roomName: meetingInfo._id,
            userId: meetingInfo.userData._id,
            userName: meetingInfo.userData.name
          }
          this.roomName = meetingInfo._id
          this.userName = meetingInfo.userData.name
          this.userId = meetingInfo.userData._id
          console.log(userData)
          this.userData = userData

        }
        console.log(meetingInfo)



      });
    /////////////////////////////////////////////////////////////////



    this.eventBusService.on('join', this.unsubscribe$, () => {
      this.socket.emit('userInfo', this.userData)
      // this.socket.emit('join:room', this.meetingId);
    });


    // Socket Code
    this.socket.on("existingParticipants", (data) => {
      console.log(data)

      this.onExistingParticipants(data);
      this.eventBusService.emit(new EventData('updateParticipants', this.participants))
      this.socket.emit('updateParticipants', this.meetingId);
    });
    this.socket.on("newParticipantArrived", (data) => {
      this.onNewParticipant(data);
    });
    // // 나중에 구현
    // this.socket.on("participantLeft", (data) => {
    //     console.log("participantLeft---------------", data)
    //     this.onParticipantLeft(data);
    //     this.eventBusService.emit(new EventData('participantLeft', data))

    // });
    // this.socket.on("receiveVideoAnswer", (data) => {
    //     // console.log(data)
    //     this.receiveVideoResponse(data);
    // });
    this.socket.on("iceCandidate", (data) => {
      // console.log(data)
      this.participants[data.userId].rtcPeer.addIceCandidate(data.candidate, function (error) {
        if (error) {
          console.error("Error adding candidate: " + error);
          return;
        }
      });
    });

    this.socket.on("Screen_Sharing", () => {
      console.log('on Screen Sharing')

      var constraints = {
        audio: this.audioDeviceExist ?
          {
            'echoCancellation': true,
            'noiseSuppression': true,
            deviceId: this.miceDeviceId
          } : false,
        video: {

          width: 320,
          framerate: { max: 24, min: 24 }

        }
      };

      console.log('stream', this.screenStream, 'sharing', this.sharing)
      var participant = this.participants[this.userId];
      var video = participant.getVideoElement();
      //--------------------------------------------
      // 스피커 변경
      //-------------------------------------------
      // Check for the sinkId property on an HTMLMediaElement instance.
      if (typeof video.sinkId !== 'undefined') {
        video.setSinkId(this.speakerDeviceId).then(() => {
          console.log('succes speaker device')
        })
          .catch(error => {
            console.log(error)
          })
      }
      if (this.sharing) {
        var options = {
          videoStream: this.screenStream,
          localVideo: video,
          mediaConstraints: constraints,
          onicecandidate: participant.onIceCandidate.bind(participant),
        }
      } else {
        var options = {
          videoStream: this.localStream,
          localVideo: video,
          mediaConstraints: constraints,
          onicecandidate: participant.onIceCandidate.bind(participant),
        }
      }
      participant.rtcPeer = WebRtcPeer.WebRtcPeerSendrecv(options,
        function (error) {
          if (error) {
            return console.error(error);
          }
          this.generateOffer(participant.offerToReceiveVideo.bind(participant));
        });

    });


    this.socket.on("updateremoteVideo", (user) => {
      var participant = this.participants[user.userId];
      participant.dispose();
      delete this.participants[user.userId];
      // this.eventBusService.emit(new EventData('updateParticipants', this.participants))
    });

    this.eventBusService.on('handleSharingClick', this.unsubscribe$, async () => {
      this.handleSharingClick()

    })

    this.eventBusService.on('handleClick', this.unsubscribe$, async () => {
      console.log('eventBusService')
      this.handleMuteClick()

    })

    this.eventBusService.on('handleMuteClick', this.unsubscribe$, async () => {
      console.log('eventBusService')
      this.handleMuteClick()

    })
    this.eventBusService.on('handleBitrateClick', this.unsubscribe$, (data) => {
      console.log('eventBusService')
      this.handleBitrateClick(data)

    })

    // 현재 접속 중인 참여자 수 구하기
    this.eventBusService.on("currentMembersCount", this.unsubscribe$, (data) => {
      console.log(data)
      this.currentMembersCount = data;
    })

  }


  onNewParticipant(request) {
    this.receiveVideo(request);

    this.eventBusService.emit(new EventData('newWhiteBoardOverlay', request.userId));
  }

  /**
   * 화면 표시용 Log 추가
   * @param str 화면 log string
   */
  private addLogStr(str: string) {
    // this.logString += `\n> ${str} `;
  }

  private addServerLogStr(str: string) {
    // this.logString += `\n<-- [server]: ${str} \n`;
  }


  //https://github.com/peterkhang/ionic-demo/blob/a5dc3bef1067eb93c2070b4d8feb233ac6d3427a/src/app/pages/videoCall/video-call.page.ts#L169
  async onExistingParticipants(msg) {


    var participant = new Participant(this.socketService, this.userId, this.userId, this.userName, this.participantsElement);
    this.participants[this.userId] = participant;

    this.participantsService.updateParticipants(this.participants[this.userId]);
    var video = participant.getVideoElement();
    console.log(video)

    // DeviceCheck Component로 부터 장치 id를 가져온다.
    this.devicesInfoService.state$
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((devicesInfo) => {
        console.log(devicesInfo)
        this.audioDeviceExist = devicesInfo.audioDeviceExist;

        // 마이크 장치가 없거나 권한이 없으면
        this.constraints = {
          audio: devicesInfo.audioDeviceExist ? {
            'echoCancellation': true,
            'noiseSuppression': true,
            deviceId: devicesInfo?.selectedMiceDeviceId,
          } : false,
          video: devicesInfo.videoDeviceExist ? {
            deviceId: devicesInfo?.selectedVideoDeviceId,
            width: 320,
            framerate: { max: 24, min: 24 }
          } : false
        };
        console.log(this.constraints)



        //--------------------------------------------
        // 스피커 변경
        //-------------------------------------------
        // Check for the sinkId property on an HTMLMediaElement instance.
        this.speakerDeviceId = devicesInfo?.selectedSpeakerDeviceId;
        console.log(this.speakerDeviceId)

        if (typeof video.sinkId !== 'undefined') {
          video.setSinkId(this.speakerDeviceId).then(() => {
            console.log('succes speaker device')
          })
            .catch(error => {
              console.log(error)
            })
        }


      });

    // getUserDevice
    // constraints(제약)에 맞는 장치로 부터 데이터 스트림을 가져옴.
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
    await navigator.mediaDevices.getUserMedia(this.constraints)
      .then((screenStream) => {
        this.localStream = screenStream;
      }).catch(function (error) {
        console.log('getUserMedia error: ' + error.name, error);
      });
    this.eventBusService.emit(new EventData("device_Check", ""))
    console.log(this.localStream)

    this.options = {
      videoStream: this.localStream,
      localVideo: video,
      mediaConstraints: this.constraints,
      onicecandidate: participant.onIceCandidate.bind(participant)
    }
    console.log(this.options)

    /////////////////////////////////////////////////////////////
    // meeting의 status가 'Open'일 경우에만 화면 나오게 변경
    const data = {
      meetingId: this.roomName
    }
    // meeting의 status 불러오기
    const result: any = await this.meetingService.getMeetingStatus(data).toPromise();

    // meeting의 status가 'Open'일 경우에만 WebRtcPeer 보내기 전용으로 생성
    if (result.status === 'Open') {
      participant.rtcPeer = WebRtcPeer.WebRtcPeerSendonly(this.options,
        function (error) {
          if (error) {
            return console.error(error);
          }
          this.generateOffer(participant.offerToReceiveVideo.bind(participant));
        });
    }
    /////////////////////////////////////////////////////////////


    // /****************************************
    // *   장치 변경 시 비디오 전환
    // *****************************************/
    // this.eventBusService.on('selectDevice', this.unsubscribe$, async (deviceInfo) => {
    // 	console.log('device change')
    // 	this.socket.emit("video_device_change", "")
    // 	console.log(deviceInfo)
    // 	this.constraints = {
    // 		audio: deviceInfo.audioDeviceExist ? {
    // 			'echoCancellation': true,
    // 			'noiseSuppression': true,
    // 			deviceId: deviceInfo.selectedMiceDeviceId
    // 		} : false,
    // 		video: deviceInfo.videoDeviceExist ? {
    // 			deviceId: deviceInfo.selectedVideoDeviceId,
    // 			width: 320,
    // 			framerate: { max: 24, min: 24 }
    // 		} : false
    // 	};
    // 	this.speakerDeviceId = deviceInfo?.selectedSpeakerDeviceId

    // 	//--------------------------------------------
    // 	// 스피커 변경
    // 	//-------------------------------------------
    // if (typeof video.sinkId !== 'undefined') {
    // 	video.setSinkId(this.speakerDeviceId).then(()=>{
    // 		console.log('succes speaker device')
    // 	})
    // 	.catch(error => {
    // 		console.log(error)
    // 	})
    // }

    // 	await navigator.mediaDevices.getUserMedia(this.constraints)
    // 		.then(async (screenStream) => {
    // 			this.localStream = screenStream;
    // 		}).catch(function (error) {
    // 			if (error.name === 'PermissionDeniedError') {
    // 				console.log('getUserMedia error: ' + error.name, error);
    // 				location.reload();
    // 				// callback('cancel');
    // 			}
    // 		});

    // 	this.options = {
    // 		videoStream: this.localStream,
    // 		localVideo: video,
    // 		mediaConstraints: this.constraints,
    // 		onicecandidate: participant.onIceCandidate.bind(participant)
    // 	}

    // 	participant.rtcPeer = WebRtcPeer.WebRtcPeerSendonly(this.options,
    // 		function (error) {
    // 			if (error) {
    // 				if (error.name == "NotAllowedError") {
    // 					return console.log('장치에 입력이 들어오고 있지 않습니다. 다시 한번 확인해주세요.')
    // 				}
    // 			}
    // 			this.generateOffer(participant.offerToReceiveVideo.bind(participant));
    // 		});
    // })








    /****************************************
    *   장치 변경 시 webRTC 오버레이
    *****************************************/


    // var options = {
    // 	// videoStream: this.localStream,
    // 	localVideo: video,
    // 	// mediaConstraints: this.constraints,
    // 	mediaConstraints: {audio:true,video:true},
    // 	onicecandidate: participant.onIceCandidate.bind(participant)
    // }
    // console.log(options)
    // participant.rtcPeer = WebRtcPeer.WebRtcPeerSendonly(options,
    // 	function (error) {
    // 		if (error) {
    // 			if (error.name == "NotAllowedError"){
    // 				return console.log('장치에 입력이 들어오고 있지 않습니다. 다시 한번 확인해주세요.')
    // 				// alert('장치에 입력이 들어오고 있지 않습니다. 다시 한번 확인해주세요.')
    // 			}
    // 			// return console.error(error);

    // 			// console.log('장치에 입력이 들어오고 있지 않습니다. 다시 한번 확인해주세요.')
    // 		}
    // 		this.generateOffer(participant.offerToReceiveVideo.bind(participant));
    // 	});



    /************************************************
    *  whiteBoard Mode 시 whiteBoard에 내 local video 오버레이
    *************************************************/
    this.eventBusService.on('whiteBoardClick', this.unsubscribe$, () => {

      // whiteBoard Mode로 변경 시
      if (this.whiteBoardMode == false) {
        this.whiteBoardMode = true;
        console.log('whiteBoard Mode On')

        // 내 local video와 name을 가져오기 위해 container 통째로
        var videoOverlay = document.getElementById(this.userId)
        videoOverlay.className = 'videoOverlay'
        // 화이트보드에 있는 videoOverlay_container로 < video, p > element를 append
        var videoOverlay_container = document.getElementById('videoOverlay_container')
        videoOverlay_container.append(videoOverlay)

      } else {
        // webRTC Mode로 변경 시
        this.whiteBoardMode = false
        console.log('whiteBoard Mode Off')

        // 내 local video와 name을 가져오기 위해 container 통째로
        var video = document.getElementById(this.userId) // 내 local video
        // videoOverlay className 지우기
        video.classList.remove("videoOverlay");
        // webRTC 있는 participants로 < video, p > element를 append
        var videoOverlay = document.getElementById('participants')
        // 내 local video bigvideo로
        video.className = 'bigvideo'
        videoOverlay.append(video)
      }


    })


    /************************************************************************   
    *  msg.data =>  ['user1', 'user2' ...]
    *  늦게 room에 들어온 사람이 room에 이미 들어온 사람들의 데이터를 받는다.
    ************************************************************************/
    // msg.data.forEach(this.receiveVideo);
    msg.data.forEach(existingUsers => {
      this.receiveVideo(existingUsers)

    });
    console.log(msg.data)
  }

  receiveVideo(sender) {
    console.log(sender)

    var participant = new Participant(this.socketService, this.userId, sender.userId, sender.name, this.participantsElement);
    this.participants[sender.userId] = participant;
    var video = participant.getVideoElement();

    console.log(this.participants)

    //--------------------------------------------
    // 스피커 변경 크롬만 작동 중 => 나중에 다른식으로 구현
    //-------------------------------------------

    if (typeof video.sinkId !== 'undefined') {
      video.setSinkId(this.speakerDeviceId).then(() => {
        console.log('succes speaker device')
      })
        .catch(error => {
          console.log(error)
        })
    }


    var options = {
      remoteVideo: video,
      onicecandidate: participant.onIceCandidate.bind(participant)
    }

    participant.rtcPeer = WebRtcPeer.WebRtcPeerRecvonly(options,
      function (error) {
        if (error) {
          return console.error(error);
        }
        this.generateOffer(participant.offerToReceiveVideo.bind(participant));
      }
    );
    this.participantsElement.style.position = 'absolute'



    /*******************************************************
    *   상대방이 bitrate 변경 시 bigvideo가 사라지거나 겹쳐지는 부분 / 화면 공유 중 bigVideo 사라지거나 겹쳐지는 부분
    ********************************************************/
    // bigvideo 없으면 내 video를 big video로 만들기
    var isExist = document.getElementsByClassName(sender.userId)

    if (this.whiteBoardMode == false) {
      // 화면 공유 시 다른 사람 화면 보고 있을 때 참여자 들어오면 bigvideo 겹쳐지는 부분
      if (!document.querySelector('.bigvideo')) {
        if (!isExist[0]) {
          document.getElementById(this.userId).className = "bigvideo";
        }
      }
    }


    /*******************************************************
    *   whiteBoard Mode 시 webRTC 상대방 비디오 오버레이
    *  receive 함수에서 상대방에 대한 비디오를 받기 때문에 receive 함수 안 여기서 작성.
    ********************************************************/
    this.eventBusService.on('whiteBoardClick', this.unsubscribe$, () => {

      // whiteBoard Mode일 경우
      if (this.whiteBoardMode == true) {
        console.log('whiteBoard Mode On')

        var receiveVideoOverlay = document.getElementById(sender.userId)
        receiveVideoOverlay.className = 'receiveVideoOverlay'
        var videoOverlay_container = document.getElementById('videoOverlay_container')
        videoOverlay_container.append(receiveVideoOverlay)

      } else {
        this.whiteBoardMode = false
        console.log('whiteBoard Mode Off')

        var video = document.getElementById(sender.userId) // 상대방 video
        video.classList.remove("receiveVideoOverlay");
        video.classList.remove("videoOverlay");

        var receiveVideoOverlay = document.getElementById('participants')
        receiveVideoOverlay.append(video)
        video.className = "smallvideo";
      }


    })

    /****************************************
    *   whiteBoard Mode 시 새로 들어 온 webRTC 상대방 비디오 오버레이
    *****************************************/
    this.eventBusService.on('newWhiteBoardOverlay', this.unsubscribe$, (sender) => {

      console.log(sender)
      if (this.whiteBoardMode == true) {
        // 내 local video와 name을 가져오기 위해 container 통째로
        var videoOverlay = document.getElementById(sender)
        videoOverlay.className = 'videoOverlay'
        var videoOverlay_container = document.getElementById('videoOverlay_container')
        videoOverlay_container.append(videoOverlay)
      }

      // 상대방 비디오 안보이게 적용 중일 때 새로운 사람이 들어오면 버튼 위치 고치기
      if (this.hiddenVideoMode == true) {
        this.hiddenVideo()
      }

    })


  }

  receiveVideoResponse(result) {
    console.log(result.userId)
    this.participants[result.userId].rtcPeer.processAnswer(result.sdpAnswer, function (error) {
      if (error) return console.error(error);
    });
    if (this.muted) {
      this.participants[result.userId].rtcPeer.audioEnabled = false;
    }
    if (this.cameraOff) {
      this.participants[result.userId].rtcPeer.videoEnabled = false;
    }

    var participant = this.participants[result.userId];


    var isExist = participant.getContainer(result.userId);
    if (isExist === "bigvideo") {
      document.getElementById(this.userId).className = "bigvideo";
    }

  }

  onParticipantLeft(request) {
    console.log('Participant ' + request.userId + ' left');
    var participant = this.participants[request.userId];

    // var isExist = document.getElementById(request.name).className;
    // var participantClass = new Participant(this.socketService, request.name, this.participantsElement)
    var isExist = participant.getContainer(request.userId);

    if (this.whiteBoardMode == false) {
      if (isExist === "bigvideo") {
        document.getElementById(this.userId).className = "bigvideo";
      }
    }

    const filterd = participants_name.filter((data) => data !== request.userId)
    participants_name = filterd;
    participant.dispose();
    delete this.participants[request.userId];

    console.log('Participant ' + request.userId + ' left');
  }

  handleLeaveRoomClick() {
    console.log('leaveRoom 실행')
    const leaveData = { roomname: this.roomName, username: this.userId }
    this.socket.emit("leaveRoom", leaveData);

    // 나중에 수정 리다이렉트
    // window.location.href = "/home.html";
  }

  async getScreenStream(callback) {

    if (navigator.mediaDevices.getDisplayMedia) {
      // console.log('navigator.mediaDevices.getDisplayMedia')
      // console.log(this.audioDeviceExist)
      let mediaStream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: true
      })
      // 오디오 장치가 있을 경우
      if (this.audioDeviceExist) {
        // 오디오 스트림 추출
        const audio = await navigator.mediaDevices.getUserMedia({
          audio: true
        })
        // 오디오랑 비디오 스트림 결합
        const screenStream = await new MediaStream([audio.getTracks()[0], mediaStream.getTracks()[0]])
        if (screenStream) {
          callback(screenStream)
        } else {
          callback('cancel')
        }
        // 오디오 장치가 없을 경우
      } else {
        if (mediaStream) {
          // 미디어 스트림만 바로 전송
          callback(mediaStream)
        } else {
          callback('cancel')
        }
      }


      // if (navigator.mediaDevices.getDisplayMedia) {
      // 	console.log('navigator.mediaDevices.getDisplayMedia')
      // 	navigator.mediaDevices.getDisplayMedia({
      // 		video: true
      // 	}).then(screenStream => {
      // 		callback(screenStream);
      // 	}).catch(function (error) {
      // 		console.log('getUserMedia error: ' + error.name, error);
      // 		callback('cancel');
      // 	});
    } else {
      function getScreenId(error, sourceId, screen_constraints) {
        console.log('getScreeId fuction')
        // navigator.mediaDevices.getUserMedia(screen_constraints).then(function (screenStream) {
        // 	callback(screenStream);
        // });
      };

      getScreenId;
    }
  }
  //Sharing end//





  /*************************************
  *	eventHandler
  *************************************/
  ///////////////////////////////////////////////////////////////
  // 카메라 On / Off
  handleCameraClick() {
    if (this.cameraOff) {
      console.log('Camera On')
      this.cameraBtn.innerText = "Camera Off";
      this.cameraOff = false;
      this.participants[this.userId].rtcPeer.videoEnabled = true;
    } else {
      console.log('Camera Off')
      this.cameraBtn.innerText = "Camera On";
      this.cameraOff = true;
      this.participants[this.userId].rtcPeer.videoEnabled = false;
    }
  }
  ///////////////////////////////////////////////////////////////



  ///////////////////////////////////////////////////////////////
  // 화면 공유
  handleSharingClick() {
    var video = this.call.querySelector('#video-' + this.userId);

    if (this.sharing) {
      console.log(this.sharing)

      // this.sharingBtn.innerText = "Screen Sharing";
      this.sharing = false;
      this.socket.emit("", '');
    } else {
      this.getScreenStream((screenStream) => {
        console.log(this.sharing)
        console.log('[ screenStream ]', screenStream)
        // 화면 공유 된 상태 [종료 아이콘으로 변경]
        this.eventBusService.emit(new EventData('handleSharingStop', ''))
        if (screenStream == 'cancel') {
          // 화면 공유 버튼을 클릭 후 화면 공유 종료 시 [화면 공유 아이콘으로 변경]
          this.eventBusService.emit(new EventData('handleSharingCancel', ''))

        } else if (screenStream != null) {
          this.screenStream = screenStream;
          video = screenStream;
          // this.sharingBtn.innerText = "Stop Sharing";
          this.sharing = true;
          this.socket.emit("Screen_Sharing", '');
        }

      });

    }
  }
  ///////////////////////////////////////////////////////////////



  ///////////////////////////////////////////////////////////////
  // 음소거
  handleMuteClick() {
    console.log('handleMuteClick')
    if (this.muted) {
      // this.muteBtn.innerText = "Mute";
      this.muted = false;
      this.participants[this.userId].rtcPeer.audioEnabled = true;
      console.log("음소거 해제")
    } else {
      // this.muteBtn.innerText = "Unmute";
      this.muted = true;
      this.participants[this.userId].rtcPeer.audioEnabled = false;
      console.log("음소거")
    }
  }
  ///////////////////////////////////////////////////////////////



  ///////////////////////////////////////////////////////////////
  // bitrate 변경
  handleBitrateClick(data) {
    console.log('handleBitrateClick')
    console.log(data);
    this.socket.emit('changeBitrate', {
      roomname: this.userData.roomName,
      bitrate: data
    })
  }
  ///////////////////////////////////////////////////////////////



  ///////////////////////////////////////////////////////////////
  // hiddenVideo 버튼 클릭 시 오버레이 비디오 숨기기
  hiddenVideo() {
    if (this.hiddenVideoMode == false) {
      this.hiddenVideoMode = true;
    }
    const smallVideo = document.querySelectorAll('.smallvideo')
    for (let index = 0; index < smallVideo.length; index++) {
      smallVideo[index].className = 'hiddenVideo'
    }

    this.eventBusService.on('whiteBoardClick', this.unsubscribe$, () => {
      this.hiddenVideoMode = false;
    })
  }

  // 버튼 클릭 시 오버레이 비디오 보이게 하기
  visibleVideo() {
    if (this.hiddenVideoMode == true) {
      this.hiddenVideoMode = false;
    }
    const smallVideo = document.querySelectorAll('.hiddenVideo')
    for (let index = 0; index < smallVideo.length; index++) {
      smallVideo[index].className = 'smallvideo'
    }

  }
  ///////////////////////////////////////////////////////////////


}



var participants_name = [];

function checkClass(userids) {
  userids.forEach(userid => {
    var isExist = document.getElementById(userid).className;

    if (isExist === "bigvideo") {
      document.getElementById(userid).classList.remove("bigvideo");
      document.getElementById(userid).className = "smallvideo";
    }
  });

  console.log(userids)
}


function Participant(socketService, userId, receiveUserid, userName, participants) {
  console.log('userId = ', userId, 'receiveUserid = ', receiveUserid)
  const socket = socketService.socket;
  participants_name.push(receiveUserid);

  this.receiveUserid = receiveUserid;
  var container = document.createElement('div');

  container.id = receiveUserid;

  var p = document.createElement('p');
  var video = document.createElement('video');

  container.appendChild(video);
  container.appendChild(p);

  if (userId === receiveUserid) {
    container.className = "bigvideo";
    p.style.color = 'yellow'
  } else {
    container.className = "smallvideo";
  }

  participants.appendChild(container);
  document.getElementById('participants').appendChild(container);

  p.appendChild(document.createTextNode(userName));

  container.onclick = function () {
    checkClass(participants_name);
    container.classList.toggle("bigvideo");
    document.getElementById(receiveUserid).classList.remove("smallvideo");
  }


  video.id = 'video-' + receiveUserid;
  video.controls = false;

  // 사파리 모바일 자동재생(전체화면 x)
  video.autoplay = true;
  video.loop = true;
  video.playsInline = true;

  this.getElement = function () {
    return container;
  }

  this.getVideoElement = function () {
    return video;
  }

  this.getContainer = function (receiveUserid) {
    var isExist = document.getElementById(receiveUserid).className;
    // isExist = 'bigvideo'
    console.log(isExist)
    return isExist;
  }

  this.offerToReceiveVideo = function (error, offerSdp, wp) {
    if (error) return console.error("sdp offer error")
    console.log('Invoking SDP offer callback function');
    var msg = {
      id: "receiveVideoFrom",
      sender: receiveUserid,
      sdpOffer: offerSdp
    };
    sendMessage(msg);
  }


  this.onIceCandidate = function (candidate, wp) {
    console.log("Local candidate" + candidate);

    var message = {
      id: 'onIceCandidate',
      candidate: candidate,
      sender: receiveUserid
    };
    sendMessage(message);
  }

  Object.defineProperty(this, 'rtcPeer', { writable: true });

  this.dispose = function () {
    console.log('Disposing participant ' + this.receiveUserid);
    this.rtcPeer.dispose();
    // container.parentNode.removeChild(container);
    container.parentNode.removeChild(container);
  };

  function sendMessage(message) {
    console.log('Senging message: ' + message.id);
    socket.emit(message.id, message);
  }
}

