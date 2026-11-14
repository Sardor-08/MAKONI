'use client'

import Image from 'next/image'
import { Pause, Play } from 'lucide-react'
import { useEffect, useState } from 'react'

const slides = [
  '/images/makoni-auth-architecture.png',
  '/images/makoni-hero-courtyard.png',
  '/images/makoni-hero-interior.png',
  '/makoni-forest-house.png',
]

export function AuthVisualCarousel() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)')
    const pauseForReducedMotion = (event?: MediaQueryListEvent) => {
      if (event?.matches ?? preference.matches) setIsPlaying(false)
    }

    pauseForReducedMotion()
    preference.addEventListener('change', pauseForReducedMotion)
    return () => preference.removeEventListener('change', pauseForReducedMotion)
  }, [])

  useEffect(() => {
    if (!isPlaying) return

    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length)
    }, 2000)

    return () => window.clearInterval(interval)
  }, [isPlaying])

  return (
    <div
      className="auth-carousel"
      role="group"
      aria-label="MAKONI uy-joylar galereyasi"
      data-active-slide={activeIndex}
    >
      <div className="auth-carousel-image-layer" aria-hidden="true">
        {slides.map((src, index) => (
          <Image
            key={src}
            alt=""
            className={index === activeIndex ? 'auth-visual-image is-active' : 'auth-visual-image'}
            fill
            priority={index === 0}
            sizes="(max-width: 760px) calc(100vw - 28px), 50vw"
            src={src}
          />
        ))}
      </div>
      <div className="auth-carousel-controls">
        <div className="auth-carousel-dots" role="group" aria-label="Rasmlarni tanlash">
          {slides.map((src, index) => (
            <button
              key={src}
              className="auth-carousel-dot"
              type="button"
              aria-label={`${index + 1}-rasmga o‘tish`}
              aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)}
            />
          ))}
        </div>
        <button
          className="auth-carousel-toggle"
          type="button"
          aria-label={isPlaying ? 'Rasmlar almashishini to‘xtatish' : 'Rasmlar almashishini davom ettirish'}
          onClick={() => setIsPlaying((playing) => !playing)}
        >
          {isPlaying ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}
