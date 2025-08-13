import React from 'react'

export default function Loader({ progress }) {
  return (
    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/60">
      <div className="text-center">
        <div className="tracking-widest text-sm sm:text-base">LOADING IMAGES... {Math.max(0, Math.min(100, Math.round(progress)))}%</div>
      </div>
    </div>
  )
}
