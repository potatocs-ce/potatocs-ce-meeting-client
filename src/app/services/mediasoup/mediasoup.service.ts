import { Injectable, effect } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { VideoService } from '../video/video.service';
import * as mediasoupClient from "mediasoup-client";
import { ToggleService } from '../toggle/toggle.service';
import { MeetingService } from '../meeting/meeting.service';
import { AuthService } from '../auth/auth.service';
import { MeetingServiceAPI } from '../../api/meeting/meetingAPI.service';
import { UserService } from '../../api/user/user.service';

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
    private userService: UserService
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
          })


          // 통신을 위해 필요한 미디어 수준 정보 요청 
          await this.socket.emit('getRouterRtpCapabilities', {}, async (data: any) => {
            // 초기 연결 설정 producer , consumer 연결 transport 
            let device = await this.loadDevice(data);
            this.device = device;
            await this.initTransports(device);

            this.produce('videoType')
          })
        })
      })
    }
  }


  // mediasoup 연결 시도
  async loadDevice(routerRtpCapabilities: any) {
    console.log('연결 시도')
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
          async ({ kind, rtpParameters }: any, callback: any, errback: any) => {
            try {
              await this.socket.emit('produce', {
                producerTransportId: this.producerTransport.id,
                kind,
                rtpParameters
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

    // 새로운 연결 들어옴
    this.socket.on(
      'newProducers',
      async (data: any) => {
        console.log('Now Producers', data)



        for (let { producer_id, producer_socket_id } of data) {
          await this.consume(producer_id, producer_socket_id)
        }
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
        console.log(data)
        // 방 참가 시 유저 업데이트도 같이 진행
        this.meetingServiceAPI.getMeetingInfo(data.room_id).subscribe(async (data2: any) => {
          const meetingInfo: any = data2;
          const userInfo: any = await this.userService.getUserInfo(data.user_id).toPromise();

          meetingInfo.userData = userInfo.userData;

          this.meetingService.meeting_info.set(meetingInfo);
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
        })
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

    // presentVideoStream에 있는지, audienceVideoStream에 있는지 찾아야 함

    if (this.videoService.presentVideoStream() != undefined && this.videoService.presentVideoStream().id == consumer_id) {
      if (this.videoService.audienceVideoStream().length > 0) {
        this.videoService.presentVideoStream.set(this.videoService.audienceVideoStream()[0]);
        this.videoService.audienceVideoStream().shift()

        this.videoService.audienceVideoStream.set([...this.videoService.audienceVideoStream()])
      } else {
        this.videoService.presentVideoStream.set(undefined);
      }
    } else {
      const filtered_stream = this.videoService.audienceVideoStream().filter((stream) => stream.id != consumer_id);
      this.videoService.audienceVideoStream.set([...filtered_stream])
    }
    // elem.remove();

    this.consumers.delete(consumer_id)
  }

  // consume 즉, 수신 설정
  async consume(producer_id: any, producer_socket_id: string) {

    this.getConsumeStream(producer_id, producer_socket_id).then(
      ({ consumer, stream, kind, name, user_id }: any) => {
        this.consumers.set(consumer.id, consumer)
        console.log(this.meetingService.meeting_info().currentMembers)
        if (kind === 'video') {
          if (this.toggleService.toggle_video_whiteboard() != 'document' && !this.videoService.presentVideoStream()) {
            this.videoService.presentVideoStream.set({ id: consumer.id, user_id, stream, name, socket_id: producer_socket_id })
          } else {
            this.videoService.audienceVideoStream.set([...this.videoService.audienceVideoStream(), { id: consumer.id, stream, user_id, name, socket_id: producer_socket_id }])
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
          console.log(data)
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


          console.log(consumer, stream, kind)
          resolve({
            consumer,
            stream,
            kind,
            name: data.name,
            user_id: data.user_id
          })
        } catch (error) {
          reject(error);
        }

      })
    })

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
        mediaConstraints = {
          audio: {
            deviceId: deviceId
          },
          video: false
        }
        audio = true
        break;
      case this.mediaType.video:
        deviceId = deviceId;
        if (deviceId != '') {
          mediaConstraints = {
            audio: false,
            video: {
              width: {
                min: 640,
                ideal: 1920
              },
              height: {
                min: 400,
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
                min: 640,
                ideal: 1920
              },
              height: {
                min: 400,
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


    if (!this.device.canProduce('video') && !audio) {
      console.error('Cannot produce video')
      return
    }
    if (this.producerLabel.has(type)) {
      console.log('Producer already exists fot this type ' + type);
      return
    }
    console.log('Mediacontraints:', mediaConstraints);

    let stream;

    try {
      // 스크린 공유인 경우
      stream = screen ? await navigator.mediaDevices.getDisplayMedia() : await navigator.mediaDevices.getUserMedia(mediaConstraints)

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
        producer = await this.producerTransport.produce(params)
      } catch (err) {
        window.alert(err)
      }

      this.producers.set(producer.id, producer)
      // 비디오라면
      if (!audio) {
        // 현재 발표 칸에 비디오가 없으면
        if (this.toggleService.toggle_video_whiteboard() != 'document' && !this.videoService.presentVideoStream()) {
          this.videoService.presentVideoStream.set({ id: producer.id, stream, user_id: this.authService.getTokenInfo()._id, name: this.authService.getTokenInfo().name + '(me)' })
        } else {
          this.videoService.audienceVideoStream.set([...this.videoService.audienceVideoStream(), { id: producer.id, stream, user_id: this.authService.getTokenInfo()._id, name: this.authService.getTokenInfo().name + '(me)' }])
        }
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

      this.toggleService.toggle_video.set(true);
    } catch (err: any) {
      if (type == this.mediaType.screen) {
        // this.isScreen = false;
        this.toggleService.toggle_screen_share.set(false)
      }
      console.log('Produce error:', err)
    }
  }




  closeProducer(type: any) {
    if (!this.producerLabel.has(type)) {
      console.log('There is no producer for this type ' + type)
      return
    }

    let producer_id = this.producerLabel.get(type)
    console.log('Close producer', producer_id)

    this.socket.emit('producerClosed', {
      producer_id
    })

    this.producers.get(producer_id).close()
    this.producers.delete(producer_id)
    this.producerLabel.delete(type)

    if (type !== this.mediaType.audio) {
      let elem: any = document.getElementsByClassName(producer_id)[0]
      elem.srcObject.getTracks().forEach(function (track: any) {
        track.stop()
      })
      if (this.videoService.presentVideoStream() && this.videoService.presentVideoStream().id == producer_id) {
        // this.videoService.presentVideoStream.set(undefined);

        if (this.videoService.audienceVideoStream().length > 0) {
          this.videoService.presentVideoStream.set(this.videoService.audienceVideoStream()[0]);
          this.videoService.audienceVideoStream().shift()

          this.videoService.audienceVideoStream.set([...this.videoService.audienceVideoStream()])
        } else {
          this.videoService.presentVideoStream.set(undefined);
        }
      } else {
        const filtered_stream = this.videoService.audienceVideoStream().filter((stream) => stream.id != producer_id);
        this.videoService.audienceVideoStream.set([...filtered_stream])
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
