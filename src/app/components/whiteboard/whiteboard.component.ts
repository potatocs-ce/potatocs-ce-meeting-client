import { Component, ElementRef, HostListener, NgZone, Renderer2, ViewChild, effect, untracked } from "@angular/core";
import { DocumentService } from "../../services/document/document.service";
import * as pdfjsLib from "pdfjs-dist";
import { RenderingService } from "../../services/rendering/rendering.service";

import { CANVAS_CONFIG } from "../../../config/config";
import { CanvasService } from "../../services/canvas/canvas.service";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { ZoomService } from "../../services/zoom/zoom.service";
import { ToolService } from "../../services/tool/tool.service";
import { DragScrollDirective } from "../../directives/drag-scroll.directive";
import { Socket } from "ngx-socket-io";
import { DocApiService } from "../../api/doc/doc-api.service";
import { MeetingService } from "../../services/meeting/meeting.service";
import { PdfDrawingService } from "../../services/socket/pdf_drawing/pdf-drawing.service";
import { ToggleService } from "../../services/toggle/toggle.service";
import { RoleSocketService } from "../../services/socket/role/role-socket.service";

@Component({
	selector: "app-whiteboard",
	standalone: true,
	imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule, DragScrollDirective],
	templateUrl: "./whiteboard.component.html",
	styleUrl: "./whiteboard.component.scss",
})
export class WhiteboardComponent {
	docInfo: any = {};
	lastPage: number = 0;
	zoomScale: number = 1;

	dragOn = true;

	@ViewChild("canvasContainer", { static: true }) public canvasContainerRef: ElementRef | any;
	@ViewChild("canvasCover", { static: true }) public coverCanvasRef: ElementRef | any;
	@ViewChild("userCanvas", { static: true }) public userCanvasRef: ElementRef | any;
	@ViewChild("rxCanvasCover", { static: true }) public rxCoverCanvasRef: ElementRef | any;
	@ViewChild("bg", { static: true }) public bgCanvasRef: ElementRef | any;
	@ViewChild("tmp", { static: true }) public tmpCanvasRef: ElementRef | any;

	@ViewChild("whiteboardSection", { static: true }) public whiteboardSectionRef: ElementRef | any;

	canvasContainer: HTMLDivElement | any;
	coverCanvas: HTMLCanvasElement | any;

	userCanvas: HTMLCanvasElement | any;
	rxCanvasCover: HTMLCanvasElement | any;

	bgCanvas: HTMLCanvasElement | any;
	tmpCanvas: HTMLCanvasElement | any;

	whiteboardSection: HTMLDivElement | any;

	// 그리기 도구용 변수
	tool: any = { type: "pen", color: "black" };

	constructor(
		private docService: DocumentService,
		private renderingService: RenderingService,
		private canvasService: CanvasService,
		private zone: NgZone,
		private zoomService: ZoomService,
		private renderer: Renderer2,
		private toolService: ToolService,
		private socket: Socket,
		private docApiService: DocApiService,
		private meetingService: MeetingService,
		private pdfDrawingService: PdfDrawingService,
		private toggleService: ToggleService,
		private roleSocketService: RoleSocketService
	) {
		pdfjsLib.GlobalWorkerOptions.workerSrc = "./assets/lib/pdf/pdf.worker.js";
		effect(
			() => {
				this.lastPage = this.docService.pageBuffer()[this.docService.lastDocNum()];
				this.docInfo = this.docService._docList()[this.docService.lastDocNum()];
				this.zoomScale = this.zoomService.zoomScale();
				if (this.docInfo && this.lastPage) {
					const lastDocNum = this.docService.lastDocNum();

					untracked(() => {
						this.pageRender(lastDocNum, this.lastPage, this.zoomScale);
						this.onResize();
					});
				}
			},
			{ allowSignalWrites: true }
		);

		// 첫 번째 effect: ToolService의 tool 상태를 가져와 this.tool에 설정
		effect(() => {
			// ToolService에서 현재 선택된 도구(tool) 정보를 가져와 this.tool에 저장
			this.tool = this.toolService.tool();

			// 주석 처리된 checkClickMode는 아마도 클릭 모드와 관련된 로직을 실행하는 메서드로 추정됨
			// this.checkClickMode();
		});

		// 두 번째 effect: MeetingService의 skipList 상태를 구독하고, 화이트보드 관련 작업 수행
		effect(() => {
			// MeetingService의 skipList를 가져와 활용
			this.meetingService.skipList();

			// untracked는 내부에서 발생하는 상태 변경이 effect의 재실행을 유발하지 않도록 함
			untracked(() => {
				// DocService에서 현재의 drawingEvents(그리기 이벤트) 데이터를 가져옴
				const drawingEvents = this.docService.getDrawingEvents();

				// 가져온 그리기 이벤트를 기반으로 렌더링 서비스에서 화이트보드 렌더링
				this.renderingService.renderBoard(this.userCanvas, this.zoomScale, drawingEvents);
			});
		});
	}

	/**
	 * 초기 세팅
	 */
	ngOnInit(): void {
		this.initCanvasSet();

		this.renderer.listen(this.canvasContainer, "scroll", (event) => {
			this.onScroll();
		});
	}

	/**
	 * 특정 컨테이너의 크기 변경 감지
	 */
	observer: any;
	observer_target: any;
	ngAfterViewInit() {
		this.observer = new ResizeObserver((entries) => {
			this.zone.run(() => {
				this.initCanvasSet();
				if (this.docInfo) this.onResize();
			});
		});

		this.observer_target = this.whiteboardSection;
		this.observer.observe(this.observer_target);
	}

	ngOnDestroy() {
		this.observer.unobserve(this.observer_target);
	}

	/**
	 * 초기 canvas 변수, container size 설정
	 */
	initCanvasSet() {
		this.tmpCanvas = this.tmpCanvasRef.nativeElement;
		this.bgCanvas = this.bgCanvasRef.nativeElement;
		this.canvasContainer = this.canvasContainerRef.nativeElement;
		this.coverCanvas = this.coverCanvasRef.nativeElement;
		this.userCanvas = this.userCanvasRef.nativeElement;
		this.rxCanvasCover = this.rxCoverCanvasRef.nativeElement;

		this.whiteboardSection = this.whiteboardSectionRef.nativeElement;

		CANVAS_CONFIG.maxContainerHeight = this.whiteboardSection.clientHeight;
		CANVAS_CONFIG.maxContainerWidth = this.whiteboardSection.clientWidth;

		console.log(this.whiteboardSection);
	}

	// @HostListener('window:resize') resize() {

	//   const newWidth = this.whiteboardSection.clientWidth;
	//   const newHeight = this.whiteboardSection.clientHeight;
	//   // sidenav 열릴때 resize event 발생... 방지용도.
	//   if (CANVAS_CONFIG.maxContainerWidth === newWidth && CANVAS_CONFIG.maxContainerHeight === newHeight) {
	//     return;
	//   }
	//   CANVAS_CONFIG.maxContainerWidth = newWidth;
	//   CANVAS_CONFIG.maxContainerHeight = newHeight;
	//   this.onResize();
	// }

	onResize() {
		if (this.docService._doc().length == 0) return;

		// Resize시 container size 조절.
		const ratio = this.canvasService.setContainerSize(this.coverCanvas, this.canvasContainer);

		this.docService.thumbData.update((data: any) => {
			data.ratio = ratio;
			data.coverWidth = this.coverCanvas.width;
			return { ...data };
		});
	}

	/**
	 * Scroll 발생 시
	 */
	onScroll() {
		if (this.docService._doc().length == 0) return;

		this.docService.thumbData.update((data: any) => {
			data.left = this.canvasContainer.scrollLeft;
			data.top = this.canvasContainer.scrollTop;
			return { ...data };
		});
	}

	/**
	 * 캔버스를 그리는데 필요한 각 캔버스 들의 사이즈를 결정하는 함수
	 * @param currentDocNum 현재 문서 번호
	 * @param currentPage 문서의 페이지 번호
	 * @param zoomScale 스케일 정보
	 */
	setCanvasSize(currentDocNum: number, currentPage: number, zoomScale: number) {
		return this.canvasService.setCanvasSize(
			currentDocNum,
			currentPage,
			zoomScale,
			this.canvasContainer,
			this.coverCanvas,
			this.rxCanvasCover,
			this.userCanvas,
			this.bgCanvas
		);
	}

	async pageRender(currentDocNum: number, currentPage: number, zoomScale: number) {
		const ratio = this.setCanvasSize(currentDocNum, currentPage, zoomScale);

		// 프리렌더링 처리
		this.preRenderBackground(currentPage);

		const drawingEvents = this.docService.getDrawingEvents();

		this.renderingService.renderBoard(this.userCanvas, zoomScale, drawingEvents);
		// pdf 판서 표현 용도
		await this.renderingService.renderBackground(this.tmpCanvas, this.bgCanvas, currentDocNum, currentPage);

		// canvas event set
		this.setCanvas();
	}

	setCanvas() {
		const data_canvas: any = this.userCanvas;
		const drawing_canvas: any = this.coverCanvas;

		if (this.tool.type == "click") {
			this.dragOn = true;
		} else {
			this.dragOn = false;
		}

		this.canvasService.addEventHandler(drawing_canvas, data_canvas, this.tool, this.zoomScale);
	}

	preRenderBackground(pageNum: number) {
		const targetCanvas = this.bgCanvas;
		const ctx = targetCanvas.getContext("2d");
		const imgElement: any = document.getElementById("thumb_" + pageNum);

		/**************************************************
		 * 처음 화이트보드에 들어오면 thumbnail view 아니라 fileList view이기 때문에
		 * document.getElementById('thumb_' + pageNum) (이미지)가 정의되지 않아 오류가 난다.
		 * 그래서 doc을 클릭하여 thumbnail view 일 경우에만 실행하도록 설정함.
		 ****************************************************/
		if (imgElement) {
			ctx.drawImage(imgElement, 0, 0, targetCanvas.width, targetCanvas.height);
		}
	}

	//=====================그리기 함수

	/**
	 * 타입 지정 함수
	 * @param type 지정할 타입
	 */
	setType(type: string) {
		this.tool.type = type;

		if (type == "highlighter" && this.tool.color == "black") {
			this.tool.color = "yellow";
		}
		this.toolService.tool.set({ ...this.tool });
		this.setCanvas();
	}

	/**
	 * 색 지정 함수
	 * @param color 색
	 */
	setColor(color: string) {
		this.tool.color = color;
		this.toolService.tool.set({ ...this.tool });
		this.setCanvas();
	}

	/**
	 * 팬 두께 지정
	 * @param width 두께
	 */
	setWidth(width: number) {
		this.tool.width = width;
		// if (this.tool.type == 'eraser') {
		//   this.tool.width += 15;
		// } else if (this.tool.type == 'highlighter') {
		//   this.tool.width += 10;
		// }

		this.toolService.tool.set({ ...this.tool });
		this.setCanvas();
	}

	clearDrawing() {
		// 여기 한 번 확인 물어보는 로직 추가
		if (window.confirm("Do you want to delete all drawings on the current page?")) {
			this.docApiService
				.clearDocDrawing(
					this.meetingService.meeting_room_id(),
					this.docService._docList()[this.docService.lastDocNum()]._id,
					this.lastPage
				)
				.subscribe((res: any) => {
					this.docService.generateDrawingData(res);

					// this.pageRender(this.docService.lastDocNum(), this.lastPage, this.zoomScale)

					this.pdfDrawingService.clearDrawing(
						this.meetingService.meeting_room_id(),
						res,
						this.docService._docList()[this.docService.lastDocNum()]._id,
						this.lastPage
					);
					// if (res.message == 'success') {
					//   // 여기서 userId 판서 정보 일단 다 지우기
					//   this.videoDrawingService.drawVarArray()[this.videoStream?.user_id] = [];
					//   const canvas_target: any = document.getElementById('canvasUser');
					//   const target_context: any = canvas_target.getContext('2d');
					//   target_context.clearRect(0, 0, canvas_target.width, canvas_target.height);
					//   this.socket.emit('draw:video_clear', { room_id: this.meetingService.meeting_room_id(), target_id: video_target.parentNode.id, meeting_id: this.meetingService.meeting_room_id() })
					// }
				});
			const canvas_target: any = document.getElementById("canvasUser");
			const target_context: any = canvas_target.getContext("2d");
			const zoomScale = this.zoomService.zoomScale();
			target_context.clearRect(0, 0, canvas_target.width / zoomScale, canvas_target.height / zoomScale);
		}
	}

	/**
	 * 페이지 확대 축소, 맟춤 함수
	 * @param action zoomIn, zoomOut, fitToWidth, fitToPage
	 */
	clickZoom(action: string): void {
		console.log(">> Click Zoom: ", action);

		if (!this.docInfo) return;

		const docNum = this.docService.lastDocNum();
		const currentPage = this.docService.pageBuffer()[docNum];
		const prevZoomScale = this.zoomService.zoomScale();

		const newZoomScale = this.zoomService.calcZoomScale(action, docNum, currentPage, prevZoomScale);
		// zoomScale 업데이트
		this.zoomService.zoomScale.set(newZoomScale);
	}

	/**
	 * 페이지 이동 버튼
	 * @param action next, prev, first, last
	 */
	pageMove(action: string) {
		if (!this.docInfo) return;

		const nowPage = this.docService.pageBuffer()[this.docService.lastDocNum()];
		const lastPage = this.docInfo.pdfDoc._pdfInfo.numPages;

		switch (action) {
			case "next":
				if (nowPage == lastPage) return;
				this.docService.updateCurrentPageNum(nowPage);
				break;
			case "prev":
				if (nowPage == 1) return;
				this.docService.updateCurrentPageNum(nowPage - 2);
				break;
			case "first":
				this.docService.updateCurrentPageNum(0);
				break;
			case "last":
				this.docService.updateCurrentPageNum(lastPage - 1);
				break;
		}
		this.pdfDrawingService.stopQueue(); // <-- 그려지고 있는게 있으면 중단
		this.roleSocketService.presentStatus();
	}

	toggleDoc() {
		// console.log('토글 토글!!!');

		this.toggleService.toggle_doc_menu.set(!this.toggleService.toggle_doc_menu());
	}
}
