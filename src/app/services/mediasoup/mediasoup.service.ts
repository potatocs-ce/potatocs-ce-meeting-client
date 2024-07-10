import { Injectable, effect } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { VideoService } from '../video/video.service';
import * as mediasoupClient from "mediasoup-client";
import { ToggleService } from '../toggle/toggle.service';
import { MeetingService } from '../meeting/meeting.service';
import { AuthService } from '../auth/auth.service';
import { MeetingServiceAPI } from '../../api/meeting/meetingAPI.service';
import { UserService } from '../../api/user/user.service';
import { DialogService } from '../dialog/dialog.service';

@Injectable({
  providedIn: 'root'
})
export class MediasoupService {
  mediaType = {
    audio: 'audioType',
    video: 'videoType',
    screen: 'screenType'
  }

  nowVideo: any = ''
  nowAudio: any = ''
  constructor(
    private socket: Socket,
    private videoService: VideoService,
    private toggleService: ToggleService,
    private meetingService: MeetingService,
    private authService: AuthService,
    private meetingServiceAPI: MeetingServiceAPI,
    private userService: UserService,
    private dialogService: DialogService
  ) {
    effect(() => {
      this.nowVideo = this.videoService.nowVideoId();
      this.nowAudio = this.videoService.nowAudioId();
    })
  }

  joined: boolean = false;

  rc: any = null;

  device: any = null;


  producerTransport: any;
  consumerTransport: any;


  consumers = new Map()
  producers = new Map()
  producerLabel = new Map()


  // 방 참가 함수
  async joinRoom() {
    const name = this.authService.getTokenInfo().name;
    const user_id = this.authService.getTokenInfo()._id;
    const room_id = this.meetingService.meeting_room_id();



    if (this.rc && this.rc.isOpen()) {
      console.log('Already connected to a room')
    } else {
      // 방 생성
      await this.socket.emit('createRoom', { room_id }, async (response: any) => {
        // 방 참가
        await this.socket.emit('join', { name, room_id, user_id }, async (response: any) => {





          this.joined = true;

          // 방 참가 시 유저 업데이트도 같이 진행
          this.meetingServiceAPI.getMeetingInfo(room_id).subscribe(async (data: any) => {
            const meetingInfo: any = data;
            const userInfo: any = await this.userService.getUserInfo(user_id).toPromise();

            meetingInfo.userData = userInfo.userData;

            this.meetingService.meeting_info.set(meetingInfo);

            // 현재 맴버 리스트
            meetingInfo.currentMembers.filter((data: any) => data.online).map((user: any) => {

              if (this.toggleService.toggle_video_whiteboard() != 'document' && !this.meetingService.present_user_info()) {
                this.meetingService.present_user_info.set({ user_id: user.member_id._id, name: user.member_id.name, screen: false, profile: user.member_id.profile_img })
              } else if (!this.meetingService.users_info().some((users: any) => users.user_id == user.member_id._id)) {
                this.meetingService.users_info.set([...this.meetingService.users_info(), { user_id: user.member_id._id, name: user.member_id.name, screen: false, profile: user.member_id.profile_img }])
              }
            })
            // console.log(this.meetingService.present_user_info(), this.meetingService.users_info())




            // 통신을 위해 필요한 미디어 수준 정보 요청 
            await this.socket.emit('getRouterRtpCapabilities', {}, async (data: any) => {
              // 초기 연결 설정 producer , consumer 연결 transport 
              let device = await this.loadDevice(data);
              this.device = device;
              await this.initTransports(device);



              if (this.videoService.videoDeviceExist()) {
                this.videoService.videoLoading.set(true);
                this.videoService.audioLoading.set(true);
                await this.produce('videoType');
                await this.produce('audioType');
              }
            })
          })

        })
      })
    }
  }


  // mediasoup 연결 시도
  async loadDevice(routerRtpCapabilities: any) {
    // console.log('연결 시도')
    let device;
    try {
      device = new mediasoupClient.Device()
    } catch (error: any) {
      if (error.name === 'UnsupportedError') {
        console.error("Browser not supperted");
        alert('Browser not supported')
      }
      console.error(error)
    }
    await device?.load({
      routerRtpCapabilities
    })

    return device;
  }

  // 연결 초기 설정
  async initTransports(device: any) {
    // init producerTransport
    {
      await this.socket.emit("createWebRtcTransport", {
        forceTcp: false,
        rtpCapabilities: device.rtpCapabilities
      }, async (data: any) => {
        if (data.error) {
          console.error(data.error)
          return
        }

        // transport 생성 
        // producer = 제공자, 내가 보내는 전송 선 생성
        this.producerTransport = device.createSendTransport(data)

        // 연결
        this.producerTransport.on(
          'connect',
          async ({ dtlsParameters }: any, callback: any, errback: any) => {
            await this.socket.emit('connectTransport', {
              dtlsParameters,
              transport_id: data.id
            }, (response: any) => response)
            callback();
          }
        )

        // server에 producer를 생성하라고 요청
        this.producerTransport.on(
          'produce',
          async ({ kind, rtpParameters, appData }: any, callback: any, errback: any) => {
            // console.log(kind, rtpParameters, appData)
            try {
              await this.socket.emit('produce', {
                producerTransportId: this.producerTransport.id,
                kind,
                rtpParameters,
                screen: appData.screen
              }, ({ producer_id, name, type }: any) => {
                callback({ id: producer_id })
              })
            } catch (err) {
              errback(err)
            }
          }
        )

        // 중복 연결 방지
        this.producerTransport.on(
          'connectionstatechange',
          (state: any) => {
            switch (state) {
              case 'connecting':
                break;

              case 'connected':
                break;

              case 'failed':
                this.producerTransport.close()
                break;

              default:
                break;
            }
          }
        )
      })
    }

    // init consumerTransport
    {
      await this.socket.emit('createWebRtcTransport', {
        forceTcp: false
      }, async (data: any) => {
        if (data.error) {
          console.error(data.error)
          return
        }

        // only one needed
        this.consumerTransport = device.createRecvTransport(data)

        this.consumerTransport.on(
          'connect',
          async ({ dtlsParameters }: any, callback: any, errback: any) => {
            try {
              await this.socket.emit('connectTransport', {
                transport_id: this.consumerTransport.id,
                dtlsParameters
              }, (response: any) => {
                callback(response)
              })
            } catch (err) {
              errback(err)
            }
          }
        )

        // 마찬가지로 중복 연결 방지
        this.consumerTransport.on(
          'connectionstatechange',
          async (state: any) => {
            switch (state) {
              case 'connecting':
                break;

              case 'connected':
                break;

              case 'failed':
                this.consumerTransport.close()
                break;

              default:
                break;
            }
          }
        )


        // 받을 준비가 되면 getProducers 시전
        await this.socket.emit('getProducers');

        this.initSockets()
      })
    }
  }

  initSockets() {
    // 받는게 하나 닫힘
    this.socket.on(
      'consumerClosed',
      ({ consumer_id }: any) => {
        console.log('Closing consumer:', consumer_id);

        this.removeConsumer(consumer_id)
      }
    )



    this.socket.on(
      'disconnect',
      () => {
        this.exit(true)
      }
    )

    this.socket.on(
      'user_join', async (data: any) => {

        // 방 참가 시 유저 업데이트도 같이 진행
        this.meetingServiceAPI.getMeetingInfo(data.room_id).subscribe(async (data2: any) => {
          const meetingInfo: any = data2;
          const userInfo: any = await this.userService.getUserInfo(data.user_id).toPromise();

          meetingInfo.userData = userInfo.userData;

          this.meetingService.meeting_info.set(meetingInfo);

          // 현재 맴버 리스트
          meetingInfo.currentMembers.filter((data: any) => data.online).map((user: any) => {

            if (this.toggleService.toggle_video_whiteboard() != 'document' && !this.meetingService.present_user_info()) {
              this.meetingService.present_user_info.set({ user_id: user.member_id._id, name: user.member_id.name, screen: false, profile: user.member_id.profile_img })
            } else if (!this.meetingService.users_info().some((users: any) => users.user_id == user.member_id._id) &&
              this.meetingService.present_user_info().user_id != user.member_id._id) {

              this.meetingService.users_info.set([...this.meetingService.users_info(), { user_id: user.member_id._id, name: user.member_id.name, screen: false, profile: user.member_id.profile_img }])
            }
          })
          // console.log(this.meetingService.present_user_info(), this.meetingService.users_info())
        })
      }
    )


    this.socket.on(
      'user_exit',
      async (data: any) => {

        // 방 참가 시 유저 업데이트도 같이 진행
        this.meetingServiceAPI.getMeetingInfo(data.room_id).subscribe(async (data2: any) => {
          const meetingInfo: any = data2;
          const userInfo: any = await this.userService.getUserInfo(data.user_id).toPromise();

          meetingInfo.userData = userInfo.userData;

          this.meetingService.meeting_info.set(meetingInfo);




          if (this.meetingService.present_user_info() && this.meetingService.present_user_info().user_id == data.user_id) {
            this.meetingService.present_user_info.set(undefined);

            if (this.meetingService.users_info().length > 0) {
              this.meetingService.present_user_info.set(this.meetingService.users_info()[0]);
              this.meetingService.users_info().shift()

              this.meetingService.users_info.set([...this.meetingService.users_info()])
            } else {
              this.meetingService.present_user_info.set(undefined);
            }
          } else {
            const filtered_stream = this.meetingService.users_info().filter((stream: any) => stream.user_id != data.user_id);
            this.meetingService.users_info.set([...filtered_stream])
          }
        })
      }
    )

    // 새로운 연결 들어옴
    this.socket.on(
      'newProducers',
      async (data: any) => {
        console.log('Now Producers', data)

        for (let { producer_id, producer_socket_id, screen } of data) {
          await this.consume(producer_id, producer_socket_id, screen)
        }
      }
    )
  }

  // 연결 제거 함수
  removeConsumer(consumer_id: any) {
    let elem: any = document.getElementsByClassName(consumer_id)[0] as HTMLVideoElement;

    if (!elem) {
      return;
    }

    const stream = elem.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(function (track: any) {
      track.stop()
    })


    // 종료하는 대상이 발표를 하고 있는 발표자라면...
    if (this.meetingService.present_user_info() && this.meetingService.present_user_info().id == consumer_id) {

      if (this.meetingService.present_user_info().screen) {
        if (this.meetingService.users_info().length > 0) {
          this.meetingService.present_user_info.set(undefined);
          this.meetingService.present_user_info.set(this.meetingService.users_info()[0]);
          this.meetingService.users_info().shift()

          this.meetingService.users_info.set([...this.meetingService.users_info()])
        } else {
          this.meetingService.present_user_info.set(undefined);
        }
      } else {

        this.meetingService.present_user_info.update((present_user_info: any) => {
          present_user_info.id = undefined;
          present_user_info.stream = undefined;

          return { ...present_user_info };
        })
      }
    } else {
      // 아니면
      this.meetingService.users_info.update((users_info: any) => {
        const index = users_info.findIndex((users: any) => users.id == consumer_id);


        if (users_info[index]?.screen) {
          const filtered_stream = this.meetingService.users_info().filter((stream: any) => stream.id != consumer_id);
          return [...filtered_stream]
        } else {
          users_info[index]?.id ? users_info[index].id = undefined : '';
          users_info[index]?.stream ? users_info[index].stream = undefined : '';

          return [...users_info];
        }

      })
    }

    // presentVideoStream에 있는지, audienceVideoStream에 있는지 찾아야 함

    // if (this.videoService.presentVideoStream() != undefined && this.videoService.presentVideoStream().id == consumer_id) {
    //   if (this.videoService.audienceVideoStream().length > 0) {
    //     this.videoService.presentVideoStream.set(this.videoService.audienceVideoStream()[0]);
    //     this.videoService.audienceVideoStream().shift()

    //     this.videoService.audienceVideoStream.set([...this.videoService.audienceVideoStream()])
    //   } else {
    //     this.videoService.presentVideoStream.set(undefined);
    //   }
    // } else {
    //   const filtered_stream = this.videoService.audienceVideoStream().filter((stream) => stream.id != consumer_id);
    //   this.videoService.audienceVideoStream.set([...filtered_stream])
    // }
    // elem.remove();

    this.consumers.delete(consumer_id)
  }

  // consume 즉, 수신 설정
  async consume(producer_id: any, producer_socket_id: string, screen: boolean) {

    this.getConsumeStream(producer_id, producer_socket_id).then(
      ({ consumer, stream, kind, name, user_id, screen }: any) => {
        this.consumers.set(consumer.id, consumer)

        if (kind === 'video') {

          // if (this.toggleService.toggle_video_whiteboard() != 'document' && !this.videoService.presentVideoStream()) {
          //   this.videoService.presentVideoStream.set({ id: consumer.id, user_id, stream, name, socket_id: producer_socket_id, screen })
          // } else {
          //   this.videoService.audienceVideoStream.set([...this.videoService.audienceVideoStream(), { id: consumer.id, stream, user_id, name, socket_id: producer_socket_id, screen }])
          // }


          if (screen == false) {
            if (this.meetingService.present_user_info()?.user_id == user_id) {
              // 유저 발표 칸에 내가 들어있고, 화면 공유 모드가 아니면
              this.meetingService.present_user_info.set({ ...this.meetingService.present_user_info(), id: consumer.id, socket_id: producer_socket_id, stream })
            } else if (this.meetingService.users_info().some((users_info: any) => users_info.user_id == user_id)) {
              // 유저들 칸에 내가 들어있으면 그 데이터에 produce stream 데이터 입히기
              this.meetingService.users_info.update((users_info: any) => {
                const index = users_info.findIndex((user: any) => user.user_id == user_id);

                users_info[index] = { ...users_info[index], id: consumer.id, stream, socket_id: producer_socket_id }

                return [...users_info]
              })
            }

          } else {
            // 화면 공유 모드를 넣으려고 하는거면 칸 하나를 더 마련해야 함
            if (this.toggleService.toggle_video_whiteboard() != 'document' && !this.meetingService.present_user_info()) {
              // 유저 발표 칸에 아무도 없고, 화면 공유 모드이면
              this.meetingService.present_user_info.set({ id: consumer.id, user_id, stream, name, socket_id: producer_socket_id, screen })
            } else {

              this.meetingService.users_info.set([...this.meetingService.users_info(), { id: consumer.id, stream, user_id, name, socket_id: producer_socket_id, screen }])
            }
          }

        } else {
          this.videoService.audioStream.set([...this.videoService.audioStream(), { id: consumer.id, stream, user_id, socket_id: producer_socket_id }])

        }

        consumer.on(
          'trackended',
          () => {
            this.removeConsumer(consumer.id)
          }
        )

        consumer.on(
          'transportclose',
          () => {
            this.removeConsumer(consumer.id)
          }
        )
      }
    )
  }


  async getConsumeStream(producerId: any, producer_socket_id: string) {
    // 요구 조건 확인
    const { rtpCapabilities } = this.device;

    return new Promise(async (resolve, reject) => {

      await this.socket.emit("consume", {
        rtpCapabilities,
        consumerTransportId: this.consumerTransport.id,
        producerId,
        producer_socket_id
      }, async (data: any) => {
        try {

          const { id, kind, rtpParameters } = data.params;


          let codecOptions = {};

          const consumer = await this.consumerTransport.consume({
            id,
            producerId,
            kind,
            rtpParameters,
            codecOptions
          })

          const stream = new MediaStream()
          stream.addTrack(consumer.track)


          console.log(consumer, stream, kind, data.screen)
          resolve({
            consumer,
            stream,
            kind,
            name: data.name,
            user_id: data.user_id,
            screen: data.screen
          })
        } catch (error) {
          reject(error);
        }

      })
    })

  }

  async requestCameraAccess(deviceId: any) {
    try {
      // 카메라 스트림 요청
      const stream = await navigator.mediaDevices.getUserMedia({ video: { deviceId } });
      // alert('Camera access granted.');
      // 권한이 부여되었으므로, 스트림을 종료합니다.
      stream.getTracks().forEach(track => track.stop());
      return true
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        this.dialogService.openDialogNegative('Camera access was denied. Please grant camera access and try again.');
      } else if (err.name === 'NotFoundError') {
        // this.dialogService.openDialogNegative('No camera was found on this device.');
      } else {
        this.dialogService.openDialogNegative('An unexpected error occurred: ' + err.message);
      }
      this.toggleService.toggle_video.set(false);
      this.videoService.videoLoading.set(false);
      return false;
    }
  }

  async requestAudioAccess(deviceId: any) {
    try {
      // 오디오 스트림 요청
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId }
      });
      // 권한이 부여되었으므로, 스트림을 종료합니다.
      stream.getTracks().forEach(track => track.stop());
      return true;
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        this.dialogService.openDialogNegative('Audio access was denied. Please grant audio access and try again.');
      } else if (err.name === 'NotFoundError') {
        // this.dialogService.openDialogNegative('No audio input device was found on this device.');
      } else if (err.name === 'OverconstrainedError') {
        this.dialogService.openDialogNegative('The specified constraints could not be satisfied by any available devices.');
      } else {
        this.dialogService.openDialogNegative('An unexpected error occurred: ' + err.message);
      }
      this.toggleService.toggle_audio.set(false);
      this.videoService.audioLoading.set(false);
      return false;
    }
  }

  //====== MAIN FUNCTION
  async produce(type: any, deviceId: any = null) {


    deviceId = deviceId == null ? this.nowVideo : deviceId;


    let mediaConstraints: any = {};
    let audio = false;
    let screen = false;
    switch (type) {
      case this.mediaType.audio:

        deviceId = deviceId;
        this.videoService.audioLoading.set(true);
        mediaConstraints = {
          audio: {
            'echoCancellation': true,
            'noiseSuppression': true,
            deviceId: deviceId
          },
          video: false
        }
        audio = true
        break;
      case this.mediaType.video:
        deviceId = deviceId;
        this.videoService.videoLoading.set(true);



        if (deviceId != '') {
          mediaConstraints = {
            audio: false,
            video: {
              width: {
                min: 320,
                ideal: 1920
              },
              height: {
                min: 200,
                ideal: 1080
              },
              deviceId: deviceId,
            }
          }
        } else {
          mediaConstraints = {
            audio: false,
            video: {
              width: {
                min: 320,
                ideal: 1920
              },
              height: {
                min: 200,
                ideal: 1080
              },
              facingMode: { exact: "user" },
            }
          }
        }

        break;
      case this.mediaType.screen:

        mediaConstraints = false
        screen = true
        break;
      default:
        return;
    }

    // 카메라 접근 확인
    if (type == this.mediaType.video && !await this.requestCameraAccess(deviceId)) return
    // 오디오 접근 여부 확인
    else if (type == this.mediaType.audio && !await this.requestAudioAccess(deviceId)) return


    if (!this.device.canProduce('video') && !audio) {
      console.error('Cannot produce video')
      return
    }
    if (this.producerLabel.has(type)) {
      console.log('Producer already exists fot this type ' + type);
      return
    }
    console.log('Mediacontraints:', mediaConstraints);

    let stream: any;

    try {

      // 스크린 공유인 경우
      stream = screen ? await navigator.mediaDevices.getDisplayMedia() : await navigator.mediaDevices.getUserMedia(mediaConstraints).catch((error: any) => {
        if (error.name === 'OverconstrainedError') {
          console.error('The constraint ' + error.constraint + ' is not satisfied by any available camera.');
        } else {
          console.error('Error accessing camera: ', error);
        }
      })

      // 오디오 공유인 경우
      const track = audio ? stream.getAudioTracks()[0] : stream.getVideoTracks()[0]
      const params: any = {
        track
      }

      if (!audio && !screen) {
        params.encodings = [
          {
            rid: 'r0',
            maxBitrate: 100000,
            scalabilityMode: 'S2T3'
          },
          {
            rid: 'r1',
            maxBitrate: 300000,
            scalabilityMode: 'S2T3'
          },
          {
            rid: 'r2',
            maxBitrate: 3600000,
            scalabilityMode: 'S2T3'
          },
        ]
        params.codecOptions = {
          videoGoogleStartBitrate: 1000
        }
      }
      let producer: any = undefined
      try {
        params.appData = { screen }
        producer = await this.producerTransport.produce(params)
        console.log(producer)
      } catch (err) {
        window.alert(err)
      }

      this.producers.set(producer.id, producer)
      // 비디오라면
      if (!audio) {

        if (screen == false) {
          if (this.meetingService.present_user_info()?.user_id == this.authService.getTokenInfo()._id) {
            // 유저 발표 칸에 내가 들어있고, 화면 공유 모드가 아니면
            this.meetingService.present_user_info.set({ ...this.meetingService.present_user_info(), id: producer.id, stream })
          } else if (this.meetingService.users_info().some((users_info: any) => users_info.user_id == this.authService.getTokenInfo()._id)) {
            // 유저들 칸에 내가 들어있으면 그 데이터에 produce stream 데이터 입히기
            this.meetingService.users_info.update((users_info: any) => {
              const index = users_info.findIndex((user: any) => user.user_id == this.authService.getTokenInfo()._id);

              users_info[index] = { ...users_info[index], id: producer.id, stream }

              return [...users_info]
            })
          }
          this.toggleService.toggle_video.set(true);
          this.videoService.videoLoading.set(false);
        } else {

          // 화면 공유 모드를 넣으려고 하는거면 칸 하나를 더 마련해야 함
          if (this.toggleService.toggle_video_whiteboard() != 'document' && !this.meetingService.present_user_info()) {
            // 유저 발표 칸에 아무도 없고, 화면 공유 모드이면
            this.meetingService.present_user_info.set({ id: producer.id, stream, user_id: this.authService.getTokenInfo()._id, name: this.authService.getTokenInfo().name, screen })
          } else {
            this.meetingService.users_info.set([...this.meetingService.users_info(), { id: producer.id, stream, user_id: this.authService.getTokenInfo()._id, name: this.authService.getTokenInfo().name, screen }])
          }
        }
      } else {
        this.toggleService.toggle_audio.set(true);
        this.videoService.audioLoading.set(false);
      }

      producer.on('trackended', () => {
        this.closeProducer(type)
      })

      producer.on('transportclose', () => {
        console.log('Producer transport close')
        if (!audio) {

        }
        this.producers.delete(producer.id)
      })

      producer.on('close', () => {
        console.log('Closing producer')
        if (!audio) {

        }
        this.producers.delete(producer.id)
      })

      this.producerLabel.set(type, producer.id)


    } catch (err: any) {

      if (type == this.mediaType.screen) {
        // this.isScreen = false;
        this.toggleService.toggle_screen_share.set(false)
        if (err.name === 'NotAllowedError' || err.name === 'NotFoundError') return
      }

      this.dialogService.openDialogNegative(err)

      // console.log('Produce error:', err)

      switch (type) {
        case this.mediaType.audio:
          this.videoService.audioLoading.set(false);
          break;
        case this.mediaType.video:
          this.videoService.videoLoading.set(false);
          break;
        default:
          break;
      }
    }
  }


  async closeProducer(type: any) {
    if (!this.producerLabel.has(type)) {
      console.log('There is no producer for this type ' + type)
      return
    }

    let producer_id = this.producerLabel.get(type)
    console.log('Close producer', producer_id, type)

    this.socket.emit('producerClosed', {
      producer_id
    })

    this.producers.get(producer_id).close()
    this.producers.delete(producer_id)
    this.producerLabel.delete(type)

    if (type !== this.mediaType.audio) {
      if (type == 'screenType') {
        this.toggleService.toggle_screen_share.set(false);
      } else {
        this.toggleService.toggle_video.set(false);
      }
      let elem: any = document.getElementsByClassName(producer_id)[0]
      elem.srcObject.getTracks().forEach(function (track: any) {
        track.stop()
      })

      if (type != 'screenType') {
        // 종료하는 대상이 발표를 하고 있는 발표자라면...
        if (this.meetingService.present_user_info() && this.meetingService.present_user_info().id == producer_id) {

          this.meetingService.present_user_info.update((present_user_info: any) => {
            present_user_info.id = undefined;
            present_user_info.stream = undefined;

            return { ...present_user_info };
          })

        } else {
          // 아니면
          this.meetingService.users_info.update((users_info: any) => {
            const index = users_info.findIndex((users: any) => users.id == producer_id);
            users_info[index].id = undefined;
            users_info[index].stream = undefined;

            return [...users_info];
          })
        }
      } else {
        if (this.meetingService.present_user_info() && this.meetingService.present_user_info().id == producer_id) {
          if (this.meetingService.users_info().length > 0) {
            this.meetingService.present_user_info.set(undefined);
            this.meetingService.present_user_info.set(this.meetingService.users_info()[0]);
            this.meetingService.users_info().shift()

            this.meetingService.users_info.set([...this.meetingService.users_info()])
          } else {
            this.meetingService.present_user_info.set(undefined);
          }

        } else {
          const filtered_stream = this.meetingService.users_info().filter((stream: any) => stream.id != producer_id);
          this.meetingService.users_info.set([...filtered_stream])
        }
      }



    }
  }


  // 나가기 함수
  exit(offline = false) {
    this.joined = false;
    // this.socket.emit('exitRoom', ())
    let clean = () => {
      this.consumerTransport.close();
      this.producerTransport.close();
      this.socket.off('disconnect')
      this.socket.off('newProducers')
      this.socket.off('consumerClosed')
      this.consumers = new Map()
      this.producers = new Map()
      this.producerLabel = new Map()
    }

    if (!offline) {
      this.socket
        .emit('exitRoom', {}, () => {
          clean()
        })
    } else {
      clean()
    }
  }
}
