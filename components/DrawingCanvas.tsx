
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingCanvasProps {
  width: number;
  height: number;
  onDrawingChange: (dataUrl: string | null) => void;
}

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ width, height, onDrawingChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);

  const getCanvasContext = useCallback(() => canvasRef.current?.getContext('2d'), []);

  useEffect(() => {
    const context = getCanvasContext();
    if (context) {
      context.lineCap = 'round';
      context.strokeStyle = '#ffeb3b'; // Bright yellow for visibility
      context.lineWidth = 5;
    }
  }, [width, height, getCanvasContext]);

  const getCoords = (event: React.MouseEvent | React.TouchEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (event.nativeEvent instanceof MouseEvent) {
      return { x: event.nativeEvent.clientX - rect.left, y: event.nativeEvent.clientY - rect.top };
    }
    if (event.nativeEvent instanceof TouchEvent) {
       return { x: event.nativeEvent.touches[0].clientX - rect.left, y: event.nativeEvent.touches[0].clientY - rect.top };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    const context = getCanvasContext();
    if (!context) return;
    const { x, y } = getCoords(event);
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawing(true);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const context = getCanvasContext();
    if (!context) return;
    const { x, y } = getCoords(event);
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    const context = getCanvasContext();
    if (!context) return;
    context.closePath();
    setIsDrawing(false);
    if(canvasRef.current){
        onDrawingChange(canvasRef.current.toDataURL('image/png'));
    }
  };
  
  const handleClear = () => {
    const context = getCanvasContext();
    if (context && canvasRef.current) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        setHasDrawing(false);
        onDrawingChange(null);
    }
  };

  return (
    <div className="absolute top-0 left-0 w-full h-full">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        className="touch-none"
      />
      {hasDrawing && (
         <button 
            onClick={handleClear} 
            className="absolute bottom-2 right-2 bg-red-500 text-white rounded-full p-2 shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
         </button>
      )}
    </div>
  );
};

export default DrawingCanvas;
