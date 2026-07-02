/**
 * @file Avatar Component
 * Componente para avatares de usuários
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string
  alt?: string
  name?: string
  size?: 'sm' | 'md' | 'lg'
  status?: 'online' | 'away' | 'offline'
}

export function Avatar({
  src,
  alt,
  name,
  size = 'md',
  status,
  className,
  ...props
}: AvatarProps) {
  const initials = name
    ?.split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
  }

  return (
    <div className={cn('relative', className)} {...props}>
      {src ? (
        <img
          src={src}
          alt={alt || name}
          className={cn(
            'rounded-full object-cover',
            sizeClasses[size],
          )}
        />
      ) : (
        <div
          className={cn(
            'rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold',
            sizeClasses[size],
          )}
        >
          {initials || '?'}
        </div>
      )}
      {status && (
        <div
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-white',
            {
              'bg-green-500 w-3 h-3': status === 'online',
              'bg-yellow-500 w-3 h-3': status === 'away',
              'bg-gray-400 w-3 h-3': status === 'offline',
            },
          )}
        />
      )}
    </div>
  )
}
