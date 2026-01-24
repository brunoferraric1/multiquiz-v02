'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { FocalPoint } from '@/types/blocks'

interface FocalPointSelectorProps {
  imageUrl: string
  focalPoint: FocalPoint
  onChange: (focalPoint: FocalPoint) => void
  className?: string
}

/**
 * FocalPointSelector - Interactive component for setting image focal point
 *
 * Users can click or drag on the image to set where the focal point should be.
 * The focal point determines which part of the image stays visible when cropped
 * via CSS object-position.
 *
 * @example
 * <FocalPointSelector
 *   imageUrl="/path/to/image.jpg"
 *   focalPoint={{ x: 50, y: 50 }}
 *   onChange={(fp) => setFocalPoint(fp)}
 * />
 */
export function FocalPointSelector({
  imageUrl,
  focalPoint,
  onChange,
  className,
}: FocalPointSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const calculateFocalPoint = useCallback(
    (clientX: number, clientY: number): FocalPoint => {
      if (!imageRef.current) return focalPoint

      const rect = imageRef.current.getBoundingClientRect()
      const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
      const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100))

      return { x: Math.round(x), y: Math.round(y) }
    },
    [focalPoint]
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault()
      setIsDragging(true)
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
      onChange(calculateFocalPoint(e.clientX, e.clientY))
    },
    [calculateFocalPoint, onChange]
  )

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      onChange(calculateFocalPoint(e.clientX, e.clientY))
    },
    [isDragging, calculateFocalPoint, onChange]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true)
  }, [])

  // Get image dimensions for overlay positioning
  const imageWidth = imageRef.current?.offsetWidth || 0
  const imageHeight = imageRef.current?.offsetHeight || 0

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative cursor-crosshair select-none touch-none rounded-lg overflow-hidden',
        className
      )}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Image container - centers image within available space */}
      <div className="w-full h-full flex items-center justify-center">
        <img
          ref={imageRef}
          src={imageUrl}
          alt=""
          className="max-w-full max-h-full object-contain pointer-events-none"
          draggable={false}
          onLoad={handleImageLoad}
        />
      </div>

      {/* Overlay positioned exactly on the image */}
      {imageLoaded && imageRef.current && (
        <div
          className="absolute pointer-events-none"
          style={{
            left: '50%',
            top: '50%',
            width: imageWidth,
            height: imageHeight,
            transform: 'translate(-50%, -50%)',
          }}
        >
          {/* Crosshair overlay */}
          {/* Horizontal line */}
          <div
            className="absolute left-0 right-0 h-px bg-white/80"
            style={{
              top: `${focalPoint.y}%`,
              boxShadow: '0 0 2px rgba(0,0,0,0.8)',
            }}
          />
          {/* Vertical line */}
          <div
            className="absolute top-0 bottom-0 w-px bg-white/80"
            style={{
              left: `${focalPoint.x}%`,
              boxShadow: '0 0 2px rgba(0,0,0,0.8)',
            }}
          />
          {/* Center marker */}
          <div
            className={cn(
              'absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 rounded-full',
              'border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.3),0_2px_8px_rgba(0,0,0,0.4)]',
              'bg-primary/80',
              isDragging && 'scale-110'
            )}
            style={{
              left: `${focalPoint.x}%`,
              top: `${focalPoint.y}%`,
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
            }}
          >
            {/* Inner dot */}
            <div className="absolute inset-1 rounded-full bg-white" />
          </div>

          {/* Dimmed corners to show crop area preview */}
          <div
            className="absolute inset-0 bg-black/30"
            style={{
              maskImage: `radial-gradient(ellipse 40% 40% at ${focalPoint.x}% ${focalPoint.y}%, transparent 0%, black 100%)`,
              WebkitMaskImage: `radial-gradient(ellipse 40% 40% at ${focalPoint.x}% ${focalPoint.y}%, transparent 0%, black 100%)`,
            }}
          />
        </div>
      )}
    </div>
  )
}
