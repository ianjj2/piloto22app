'use client'

import { useState, useEffect } from 'react'
import { motion, PanInfo } from 'framer-motion'

export function FloatingClock() {
  const [time, setTime] = useState('')
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }
      setTime(now.toLocaleTimeString('pt-BR', options))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="fixed z-50 cursor-move"
      style={{
        x: position.x,
        y: position.y,
      }}
      drag
      dragMomentum={false}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={(_: unknown, info: PanInfo) => {
        setIsDragging(false)
        setPosition({
          x: position.x + info.offset.x,
          y: position.y + info.offset.y,
        })
      }}
    >
      <div className={`
        bg-gray-800/90 backdrop-blur-sm
        text-white text-sm font-medium
        px-3 py-2 rounded-full
        shadow-lg
        ${isDragging ? 'ring-2 ring-blue-500' : ''}
        transition-all duration-200
      `}>
        {time}
      </div>
    </motion.div>
  )
} 