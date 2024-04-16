import { Injectable, effect } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import { VideoService } from '../video/video.service';
import * as mediasoupClient from "mediasoup-client";

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
    private videoService: VideoService
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

  name: string = '호균'

  // 방 참가 함수
  async joinRoom() {
    const name = this.name
    const room_id = 'test_server';

    if (this.rc && this.rc.isOpen()) {
      console.log('Already connected to a room')
    } else {
      // 방 생성
      await this.socket.emit('createRoom', { room_id }, async (response: any) => {
        // 방 참가
        await this.socket.emit('join', { name, room_id }, async (response: any) => {
          this.joined = true;
          // 통신을 위해 필요한 미디어 수준 정보 요청 
          await this.socket.emit('getRouterRtpCapabilities', {}, async (data: any) => {
            // 초기 연결 설정 producer , consumer 연결 transport 
            let device = await this.loadDevice(data);
            this.device = device;
            await this.initTransports(device)
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
  }

  // 연결 제거 함수
  removeConsumer(consumer_id: any) {
    let elem: any = document.getElementsByClassName(consumer_id)[0] as HTMLVideoElement
    const stream = elem.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(function (track: any) {
      track.stop()
    })

    // presentVideoStream에 있는지, audienceVideoStream에 있는지 찾아야 함
    if (this.videoService.presentVideoStream().id == consumer_id) {
      this.videoService.presentVideoStream.set(undefined);
    } else {
      const filtered_stream = this.videoService.audienceVideoStream().filter((stream) => stream.id != consumer_id);
      this.videoService.audienceVideoStream.set([...filtered_stream])
    }

    this.consumers.delete(consumer_id)
  }

  // consume 즉, 수신 설정
  async consume(producer_id: any, producer_socket_id: string) {

    this.getConsumeStream(producer_id, producer_socket_id).then(
      ({ consumer, stream, kind, name }: any) => {
        this.consumers.set(consumer.id, consumer)

        if (kind === 'video') {
          if (!this.videoService.presentVideoStream()) {

            this.videoService.presentVideoStream.set({ id: consumer.id, stream, name })
          } else {
            this.videoService.audienceVideoStream.set([...this.videoService.audienceVideoStream(), { id: consumer.id, stream, name }])
          }
        } else {
          // console.log(name, producer_socket_id)
          // elem = document.createElement('audio')
          // elem.srcObject = stream
          // elem.id = consumer.id
          // // elem.playsInline = false
          // elem.autoplay = true;
          // elem.pause();
          // // 원격 오디오 요소 추가
          // this.remoteAudiosEl.nativeElement.appendChild(elem)

          // // 오디오 컨텍스트 생성
          // let audioContext = new AudioContext();

          // // 소스 노드 생성
          // let source = audioContext.createMediaStreamSource(stream);

          // // Analyser 노드 생성
          // let analyser = audioContext.createAnalyser();
          // source.connect(analyser);

          // // FFT 크기 설정 (분석을 위한 배열의 크기)
          // analyser.fftSize = 2048;
          // let bufferLength = analyser.frequencyBinCount;
          // let dataArray = new Uint8Array(bufferLength);

          // let audioTime: any;

          // console.log(video);
          // 소리 데시벨 모니터링
          // function monitorDecibel() {
          //   // FFT 데이터 가져오기
          //   analyser.getByteFrequencyData(dataArray);

          //   // 데시벨 값 계산
          //   let sum = 0;
          //   for (let i = 0; i < bufferLength; i++) {
          //     sum += dataArray[i];
          //   }
          //   let average = sum / bufferLength;
          //   let decibel = 20 * Math.log10(average / 255);
          //   // console.log(decibel)
          //   // 임계값 초과 시 콘솔에 로그 출력
          //   // -20 데시벨
          //   if (decibel > -20) {
          //     const video: any = document.getElementsByClassName(`${producer_socket_id}`)[0];
          //     if (video) video.style.border = '2px solid rgba(255, 180, 18)'

          //     elem.play();
          //     if (audioTime) {
          //       clearTimeout(audioTime)
          //     }

          //     // console.log(`${name}의 소리가 -20dB를 초과했습니다!`);

          //     audioTime = setTimeout(() => {
          //       if (video) video.style.border = '2px solid rgba(0,0,0,0)'
          //       elem.pause();
          //     }, 3000);
          //   }

          //   // 주기적으로 모니터링
          //   requestAnimationFrame(monitorDecibel);
          // }
          // // 소리 데시벨 모니터링 시작
          // monitorDecibel();
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


          console.log(consumer, stream, kind)
          resolve({
            consumer,
            stream,
            kind,
            name: data.name
          })
        } catch (error) {
          reject(error);
        }

      })
    })

  }



  //====== MAIN FUNCTION
  async produce(type: any, deviceId: any = null) {
    let mediaConstraints: any = {};
    let audio = false;
    let screen = false;
    switch (type) {
      case this.mediaType.audio:

        deviceId = this.nowAudio;
        mediaConstraints = {
          audio: {
            deviceId: deviceId
          },
          video: false
        }
        audio = true
        break;
      case this.mediaType.video:
        deviceId = this.nowVideo;
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
        if (!this.videoService.presentVideoStream()) {
          this.videoService.presentVideoStream.set({ id: producer.id, stream, name: this.name })
        } else {
          this.videoService.audienceVideoStream.set([...this.videoService.audienceVideoStream(), { id: producer.id, stream, name: this.name }])
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

    } catch (err: any) {
      if (type == this.mediaType.screen) {
        // this.isScreen = false;
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
      if (this.videoService.presentVideoStream().id == producer_id) {
        this.videoService.presentVideoStream.set(undefined);
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
