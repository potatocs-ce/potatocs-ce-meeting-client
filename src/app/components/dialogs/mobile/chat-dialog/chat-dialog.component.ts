import { CommonModule } from "@angular/common";
import { Component, effect, ElementRef, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MeetingService } from "../../../../services/meeting/meeting.service";
import { MeetingServiceAPI } from "../../../../api/meeting/meetingAPI.service";
import { AuthService } from "../../../../services/auth/auth.service";
import { ChatSocketService } from "../../../../services/socket/chat/chat-socket.service";
import { StackImageService } from "../../../../services/stackImage/stack-image.service";
import { DrawingService } from "../../../../services/drawing/drawing.service";
import { DialogService } from "../../../../services/dialog/dialog.service";

@Component({
	selector: "app-chat-dialog",
	standalone: true,
	imports: [CommonModule, FormsModule, MatButtonModule, MatIconModule],
	templateUrl: "./chat-dialog.component.html",
	styleUrl: "./chat-dialog.component.scss",
})
export class ChatDialogComponent {
	chatContent: string = ""; // 사용자가 타이핑 하는 input 내용 변수

	chat_info: any = [];
	user_id: any;

	card_divs: any = [];

	@ViewChild("target") private myScrollContainer: ElementRef | any;

	constructor(
		private meetingService: MeetingService,
		private meetingServiceApi: MeetingServiceAPI,
		private authService: AuthService,
		private chatSocketService: ChatSocketService,
		public stackImageService: StackImageService,
		private drawingService: DrawingService,
		private dialogService: DialogService
	) {
		// chat_info
		effect(() => {
			const before = this.chat_info;
			this.chat_info = this.meetingService.meeting_chat_info();

			const after = this.chat_info.filter((x: any) => !before.includes(x));

			setTimeout(() => {
				after.forEach((data1: any, index1: number) => {
					const chatContainer = document.createElement("div");
					chatContainer.className = "chat";

					const name_section = document.createElement("section");
					name_section.className = "name_section";

					const name = document.createElement("span");
					name.className = "name";
					name.innerHTML = data1.chatMember;

					// 내가 보낸 메시지면 dot 표현
					if (data1.userId == this.user_id) {
						const dot = document.createElement("div");
						dot.className = "dot";
						name.appendChild(dot);
					}

					const time_span = document.createElement("span");
					time_span.className = "time";
					time_span.innerHTML = new Date(data1.createdAt).toLocaleString();

					name_section.appendChild(name);
					name_section.appendChild(time_span);

					chatContainer.appendChild(name_section);

					const content_section = document.createElement("section");
					content_section.className = "content_section";
					content_section.innerHTML = data1.chatContent;

					chatContainer.appendChild(content_section);

					const content_image = document.createElement("section");
					content_image.className = "content_image";

					data1.images.forEach((data2: any, index2: number) => {
						this.meetingServiceApi.getChatImage(data2.key).subscribe((res2: any) => {
							data2.blob = URL.createObjectURL(res2);

							// canvas 생성
							const canvas: any = document.createElement("canvas");
							// height는 50px 고정
							canvas.width = 160;
							// width 는 height랑 비율 맞춰서 지정
							canvas.height = data2.height * (160 / data2.width);

							// getContext
							const context: any = canvas.getContext("2d");
							// 50px 로 줄어들면 얼마나 줄어든건지 계산
							const zoomScale = 160 / data2.width;

							// canvas 스케일 변경 젹용
							context.setTransform(zoomScale, 0, 0, zoomScale, 0, 0);
							// 그림 그리기
							// console.log(res[i].images[j])
							data2.drawingDatas?.forEach((data: any) => {
								this.drawingService.end(context, data.points, data.tool);
							});

							canvas.style.position = "absolute";
							canvas.style.top = "0";
							canvas.style.left = "0";
							canvas.addEventListener("click", () => {
								// console.log(img, canvas)
								this.openCapturedDialog(data2);
							});
							data2.canvas = canvas;

							const content_images_div = document.createElement("div");
							content_images_div.className = "content_images_div";
							const img = document.createElement("img");
							img.id = "img-" + index1 + "-" + index2;
							img.className = "chat_image";
							img.src = data2.blob;
							img.width = 160;
							img.alt = "Image";
							content_images_div.appendChild(img);
							content_image.appendChild(content_images_div);
							// const img = document.getElementById();
							if (data2.canvas && !img?.nextElementSibling)
								img?.insertAdjacentElement("afterend", data2.canvas);
							// const mydiv: any = img?.parentNode;
							content_images_div.style.height = data2.height * (160 / data2.width) + "px";
							this.scrollToBottom();
						});
					});

					chatContainer.appendChild(content_image);

					this.myScrollContainer.nativeElement.appendChild(chatContainer);
				});
				this.scrollToBottom();
			});
		});

		effect(() => {
			this.stackImageService
				.imageStack()
				.filter((x: any) => !this.card_divs.includes(x))
				.map((res: any) => {
					// div 생성 아래의 img, canvas 등을 담을 틀
					const div: any = document.createElement("div");
					// 클래스 이름 지정
					div.className = "div_card";
					// width는 height가 50px일 경우 width 비율 계산해서 결정
					div.style.width = res.width * (50 / res.height) + "px";
					// img 생성
					const img: any = document.createElement("img");
					// data 지정
					img.src = res.dataURL;
					// height 는 50px
					img.height = 50;

					// canvas 생성
					const canvas: any = document.createElement("canvas");
					// height는 50px 고정
					canvas.height = 50;
					// width 는 height랑 비율 맞춰서 지정
					canvas.width = res.width * (50 / res.height);

					// getContext
					const context: any = canvas.getContext("2d");
					// 50px 로 줄어들면 얼마나 줄어든건지 계산
					const zoomScale = 50 / res.height;

					// canvas 스케일 변경 젹용
					context.setTransform(zoomScale, 0, 0, zoomScale, 0, 0);
					// 그림 그리기
					res.drawingDatas.forEach((data: any) => {
						this.drawingService.end(context, data.points, data.tool);
					});

					// mat-icon 요소로 추가 (아이콘 )
					const deleteButton: any = document.createElement("mat-icon");
					// 처음 deleteButton, 제일 마지막거 왜에는 필수 class
					deleteButton.className = `deleteButton mat-icon material-icons notranslate material-symbols-outlined mat-icon-no-color ${
						this.stackImageService.imageStack().length - 1
					}`;
					// 태그 내부에 cancel입력
					deleteButton.innerHTML = "cancel";
					// 속성 요소롤 fontSet 지정
					deleteButton.setAttribute("fontSet", "material-symbols-outlined");
					// 지우기 버튼을 클릭하면....
					deleteButton.addEventListener("click", (event: any) => {
						// 클래스 이름에 심어져 있는 순서 가져오기
						const classList = event.currentTarget.className.split(" ");
						// 실질적 데이터 제거
						this.stackImageService.imageStack.update((data: any) => {
							data.splice(classList[classList.length - 1], 1);
							return data;
						});
						// 화면에서 보이는 부분 제거
						event.currentTarget.parentElement.remove();
					});

					// 이미지 붙이기
					div.appendChild(img);
					// canvas 붙이기
					div.appendChild(canvas);
					// 지우기 버튼 붙이기
					div.appendChild(deleteButton);

					// 마지막 요소에 하나 추가하기
					document.getElementsByClassName("image_section")[0].appendChild(div);
					// document.getElementById(`imgby${this.stackImageService.imageStack().length - 1}`)?.parentElement?.appendChild(canvas)
				});
			this.card_divs = this.stackImageService.imageStack();
		});

		this.user_id = this.authService.getTokenInfo()._id;
	}

	ngOnInit() {
		// this.getMeetingChat();
	}

	// meetingId 로 db에 있는 채팅 정보 가져오기
	getMeetingChat() {
		this.meetingServiceApi.getMeetingChat(this.meetingService.meeting_room_id()).subscribe((res: any) => {
			this.meetingService.meeting_chat_info.set(res);
		});
	}

	// 채팅 보내기
	submitChat() {
		const data = {
			meetingId: this.meetingService.meeting_room_id(),
			userId: this.user_id,
			chatContent: this.chatContent,
		};

		// this.meetingServiceApi.createChat(data).subscribe((res) => {
		//   this.chatSocketService.sendChat(res);
		// })

		this.chatContent = "";
	}

	// 마지막 채팅에 스크롤 focus
	// http://daplus.net/scroll-angular-2-%EC%95%84%EB%9E%98%EB%A1%9C-%EC%8A%A4%ED%81%AC%EB%A1%A4-%EC%B1%84%ED%8C%85-%EC%8A%A4%ED%83%80%EC%9D%BC/
	scrollToBottom(): void {
		try {
			// this.scrolltop = this.myScrollContainer.nativeElement.scrollHeight;

			this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
		} catch (err) {}
	}

	// 캔버스 클릭하면
	openCapturedDialog(data: any): void {
		this.dialogService.openCapturedDialog(data).subscribe((res: any) => {});
	}
}
