import React from 'react'

export default function Footer() {
  return (
    <footer className="w-full bg-black text-white py-16">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-start justify-between gap-8">
        <div>
          <div className="text-2xl font-semibold flex items-center gap-2">
            <span>Doze</span>
            <span className="opacity-70">—</span>
            <span>Studio</span>
            <img src="/assets/favicon.gif" alt="logo" className="h-4 w-4 ml-2" />
          </div>
          <div className="opacity-70 mt-1 text-sm">Crafting motion, shaping brands</div>
        </div>
        <div className="text-sm opacity-80">
          <div>© {new Date().getFullYear()} DOZE.STD — All rights reserved</div>
          <div className="mt-1">hello@doze.studio</div>
        </div>
      </div>
    </footer>
  )
}
