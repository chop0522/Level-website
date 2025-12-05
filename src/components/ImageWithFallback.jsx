// src/components/ImageWithFallback.jsx
import React from 'react'

export default function ImageWithFallback({ src, webp, alt, loading = 'lazy', ...props }) {
  return (
    <picture>
      {webp && <source srcSet={webp} type="image/webp" />}
      <img src={src} alt={alt} loading={loading} {...props} />
    </picture>
  )
}
