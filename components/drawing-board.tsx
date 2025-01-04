'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eraser, Paintbrush } from 'lucide-react';
import { cn } from "@/lib/utils";
import { analyzeDrawing } from "@/app/actions";

export function DrawingBoard() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#FFFFFF');
    const [isEraser, setIsEraser] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [response, setResponse] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const updateCanvasSize = () => {
            // Use window.innerWidth and window.visualViewport.height for more accurate mobile sizing
            canvas.width = window.innerWidth;
            canvas.height = window.visualViewport?.height || window.innerHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        };

        updateCanvasSize();

        // Listen to both resize and visualViewport resize events
        window.addEventListener('resize', updateCanvasSize);
        window.visualViewport?.addEventListener('resize', updateCanvasSize);

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';

        return () => {
            window.removeEventListener('resize', updateCanvasSize);
            window.visualViewport?.removeEventListener('resize', updateCanvasSize);
        };
    }, [color]);

    const startDrawing = (x: number, y: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (x: number, y: number) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.strokeStyle = isEraser ? '#000000' : color;
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        startDrawing(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        draw(e.clientX - rect.left, e.clientY - rect.top);
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const touch = e.touches[0];
        startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
    };

    const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const touch = e.touches[0];
        draw(touch.clientX - rect.left, touch.clientY - rect.top);
    };

    const handleSubmit = async () => {
        if (!prompt) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        setIsLoading(true);
        try {
            const imageData = canvas.toDataURL('image/png');
            const result = await analyzeDrawing(imageData, prompt);
            setResponse(result.text);
        } catch (error) {
            console.error('Error:', error);
            setResponse('Failed to analyze drawing. Please try again.');
        }
        setIsLoading(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        setResponse('');
    };

    return (
        <div className="fixed inset-0 overflow-hidden bg-black">
            <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={stopDrawing}
                className="touch-none cursor-crosshair"
            />

            {/* Top Controls */}
            <div
                className="absolute top-4 left-1/2 -translate-x-1/2 p-3 flex items-center gap-3 bg-zinc-900 rounded-lg shadow-lg">
                {/* Color Picker Button */}
                <div className="relative w-9 h-9 flex-shrink-0">
                    <button
                        className="absolute inset-0 rounded-md border-2 border-zinc-700 overflow-hidden"
                        style={{ backgroundColor: color }}
                    >
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => {
                                setColor(e.target.value);
                                setIsEraser(false);
                            }}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                    </button>
                </div>

                {/* Tool Buttons */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEraser(true)}
                        className={cn(
                            "h-9 gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800",
                            isEraser && "bg-zinc-800 text-white"
                        )}
                    >
                        <Eraser className="w-4 h-4" />
                        Eraser
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEraser(false)}
                        className={cn(
                            "h-9 gap-2 text-zinc-400 hover:text-white hover:bg-zinc-800",
                            !isEraser && "bg-zinc-800 text-white"
                        )}
                    >
                        <Paintbrush className="w-4 h-4" />
                        Brush
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearCanvas}
                        className="h-9 text-zinc-400 hover:text-white hover:bg-zinc-800"
                    >
                        Clear
                    </Button>
                </div>
            </div>

            {/* Bottom Controls */}
            <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl p-3 bg-zinc-900 rounded-lg shadow-lg">
                <div className="flex gap-3">
                    <Input
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ask about your drawing..."
                        className="flex-1 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus-visible:ring-zinc-700"
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="bg-zinc-800 text-white hover:bg-zinc-700 focus-visible:ring-zinc-700"
                    >
                        {isLoading ? 'Analyzing...' : 'Submit'}
                    </Button>
                </div>
                {response && (
                    <div className="mt-3 p-3 rounded-md bg-zinc-800">
                        <p className="text-sm text-zinc-300 whitespace-pre-wrap">{response}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
