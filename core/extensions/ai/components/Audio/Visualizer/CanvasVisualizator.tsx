import { useEffect, useRef, useCallback } from "react";
import styled from "@emotion/styled";

const CanvasContainer = styled.div`
	width: 100%;
	height: 100%;
	position: relative;
	display: flex;
	align-items: center;
	overflow: hidden;
`;

const Canvas = styled.canvas`
	width: 100%;
	height: 100%;
	border-radius: var(--radius-small);
`;

interface AudioVisualizationProps {
	audioHistory: number[];
	isRecording: boolean;
	isPaused: boolean;
	waveSpeed?: number;
}

class CanvasAudioVisualizator {
	private canvas: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D;
	private animationFrameId: number = null;
	private devicePixelRatio: number;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d")!;
		this.devicePixelRatio = window.devicePixelRatio || 1;
		this.setupCanvas();
	}

	private setupCanvas() {
		const rect = this.canvas.getBoundingClientRect();
		this.canvas.width = rect.width * this.devicePixelRatio;
		this.canvas.height = rect.height * this.devicePixelRatio;
		this.ctx.scale(this.devicePixelRatio, this.devicePixelRatio);
		this.canvas.style.width = rect.width + "px";
		this.canvas.style.height = rect.height + "px";
	}

	private getCanvasStyle(cssVar: string): string {
		const style = getComputedStyle(document.documentElement);
		return style.getPropertyValue(cssVar).trim();
	}

	private drawCenterLine() {
		const width = this.canvas.width / this.devicePixelRatio;
		const height = this.canvas.height / this.devicePixelRatio;
		const centerY = height / 2;
		const pointWidth = 2;
		const pointSpacing = 3;
		const pointHeight = 2;
		const maxPoints = Math.floor(width / pointSpacing);

		this.ctx.fillStyle = `hsl(${this.getCanvasStyle("--inverse-primary-fg")})`;
		this.ctx.globalAlpha = 0.3;

		for (let i = 0; i < maxPoints; i++) {
			const x = i * pointSpacing;
			this.ctx.fillRect(x, centerY - pointHeight / 2, pointWidth, pointHeight);
		}
	}

	private drawWaveform(audioHistory: number[], isRecording: boolean, isPaused: boolean, waveSpeed: number) {
		const width = this.canvas.width / this.devicePixelRatio;
		const height = this.canvas.height / this.devicePixelRatio;
		const centerY = height / 2;
		const pointWidth = 2;
		const pointSpacing = 3;
		const maxPoints = Math.floor(width / pointSpacing);

		const displayHistory = audioHistory.slice(-maxPoints);
		const isLive = isRecording && !isPaused;

		displayHistory.forEach((amplitude, index) => {
			const x = width - (index + 1) * pointSpacing;
			const variation = Math.sin(index * 0.1 * waveSpeed) * 2;
			const finalAmplitude = Math.max(4, amplitude + variation);
			const pointHeight = Math.min(finalAmplitude, height * 0.8);

			this.ctx.fillStyle = `hsl(${this.getCanvasStyle("--inverse-primary-fg")})`;
			this.ctx.globalAlpha = 0.9;

			if (isLive && index >= displayHistory.length - 10) {
				const pulsePhase = ((Date.now() * waveSpeed) / 600 + index * 0.1 * waveSpeed) % (Math.PI * 2);
				const pulseScale = 1 + Math.sin(pulsePhase) * 0.3;
				const glowHeight = pointHeight * pulseScale;

				this.ctx.shadowColor = `hsl(${this.getCanvasStyle("--inverse-primary-fg")})`;
				this.ctx.shadowBlur = 3;
				this.ctx.globalAlpha = 1;

				this.ctx.fillRect(x, centerY - glowHeight / 2, pointWidth, glowHeight);

				this.ctx.shadowBlur = 0;
			} else {
				this.ctx.fillRect(x, centerY - pointHeight / 2, pointWidth, pointHeight);
			}
		});
	}

	public render(props: { audioHistory: number[]; isRecording: boolean; isPaused: boolean; waveSpeed: number }) {
		this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
		this.ctx.globalAlpha = 1;

		this.drawCenterLine();
		this.drawWaveform(props.audioHistory, props.isRecording, props.isPaused, props.waveSpeed);
	}

	public startAnimation(renderCallback: () => void) {
		const animate = () => {
			renderCallback();
			this.animationFrameId = requestAnimationFrame(animate);
		};
		animate();
	}

	public stopAnimation() {
		if (this.animationFrameId) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}
	}

	public resize() {
		this.setupCanvas();
	}

	public destroy() {
		this.stopAnimation();
	}
}

export const CanvasVisualizator = (props: AudioVisualizationProps) => {
	const { audioHistory, isRecording, isPaused, waveSpeed = 1 } = props;
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const rendererRef = useRef<CanvasAudioVisualizator>(null);

	const render = useCallback(() => {
		if (!rendererRef.current) return;

		rendererRef.current.render({
			audioHistory,
			isRecording,
			isPaused,
			waveSpeed,
		});
	}, [audioHistory, isRecording, isPaused, waveSpeed]);

	useEffect(() => {
		if (!canvasRef.current) return;

		rendererRef.current = new CanvasAudioVisualizator(canvasRef.current);

		const handleResize = () => {
			if (rendererRef.current) rendererRef.current.resize();
		};

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
			if (rendererRef.current) rendererRef.current.destroy();
		};
	}, []);

	useEffect(() => {
		if (isRecording && !isPaused) rendererRef.current?.startAnimation(render);
		else {
			rendererRef.current?.stopAnimation();
			render();
		}

		return () => {
			rendererRef.current?.stopAnimation();
		};
	}, [isRecording, isPaused, render]);

	return (
		<CanvasContainer>
			<Canvas ref={canvasRef} />
		</CanvasContainer>
	);
};

export default CanvasVisualizator;
