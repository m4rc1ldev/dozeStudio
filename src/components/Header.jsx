import React from 'react'

export default function Header({ headerDark, clock }) {
  return (
    <header className={`fixed top-4 left-0 w-full z-[100] px-4 sm:px-8 flex items-center justify-between ${headerDark ? 'text-black' : 'text-white'}`}>
      {/* Brand with GIF */}
      <div className="flex items-center gap-3 text-sm sm:text-base">
        <div className="flex items-center gap-2 text-xl sm:text-2xl">
          <span className="font-medium">Doze</span>
          <span className="opacity-70">—</span>
          <span className="font-medium">Studio</span>
          <img src="/assets/favicon.gif" alt="logo" className="h-4 w-4 ml-2" />
        </div>
      </div>
      {/* Center nav fades in the white section */}
      <nav className={`sm:block hidden  xs:block text-base sm:text-xl transition-opacity duration-300 ${headerDark ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        Projects, About, Labs
      </nav>
      {/* Clock */}
      <div className="text-sm sm:text-base  md:text-xl">{clock}</div>
    </header>
  )
}
