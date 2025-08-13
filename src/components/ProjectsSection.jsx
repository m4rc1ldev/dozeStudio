import React from 'react'

export default function ProjectsSection() {
  return (
    <div className="w-full bg-white text-black">
      <div className="mx-auto max-w-6xl py-24 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left video preview area */}
        <div className="md:col-span-5 flex items-start justify-center">
          <div className="sticky top-24 w-[260px] h-[200px] sm:w-[320px] sm:h-[280px] md:w-[380px] md:h-[360px] lg:w-[420px] lg:h-[400px] rounded overflow-hidden">
            {/* Videos stacked absolute with captions; visibility toggled on hover */}
            {[
              { key: 'mustela', src: '/videos/MUSTELA.mp4', caption: 'Advertising — A calming, visually engaging ad for Mustela’s “melting massage balm”.' },
              { key: 'a24', src: '/videos/a24.mp4', caption: 'Title Design — Experimental idents inspired by A24’s eclectic slate.' },
              { key: 'citroen', src: '/videos/CITROEN.mp4', caption: 'Product Launch — Citroën ë–C3 visual narrative and roll‑out.' },
              { key: 'farcry', src: '/videos/FARCRY.mp4', caption: 'Game Promo — Far Cry 6: kinetic trailers and graphic systems.' },
              { key: 'perspective', src: '/videos/perspective.mp4', caption: 'Brand Film — Perspective Fund mission told through motion.' },
              { key: 'martin', src: '/videos/martin.mp4', caption: 'Music — Martin Solveig visuals for stage and socials.' },
              { key: 'collectif', src: '/videos/collect_if.mp4', caption: 'Campaign — Nope Collectif collaborative series.' },
              { key: 'heiwa', src: '/videos/heiwa.mp4', caption: 'Identity — Heiwa minimal geometry, soft motion.' },
              { key: 'alttacurio', src: '/videos/alttacurio.mp4', caption: 'Product — Altƚta Curio motion specs and model teasers.' },
              { key: 'mobil', src: '/videos/Mastre_Mobile.mp4', caption: 'App — Mobil M product walkthroughs and design system.' },
              { key: 'nothing', src: '/videos/Nothing.mp4', caption: 'Launch — Nothing Ear: crisp grids and punchy typography.' },
            ].map((v) => (
              <div key={v.key} className="absolute inset-0">
                <video
                  id={`vid-${v.key}`}
                  src={v.src}
                  muted
                  playsInline
                  preload="metadata"
                  className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-200"
                />
                <div
                  id={`cap-${v.key}`}
                  className="absolute bottom-2 left-2 right-2 text-[11px] leading-snug bg-white/85 text-black px-2 py-1 rounded opacity-0 transition-opacity duration-200"
                >
                  {v.caption}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Right list */}
        <div className="md:col-span-7">
          <ul className="space-y-4 text-3xl sm:text-4xl md:text-5xl leading-[1.15]">
            {[
              { label: 'Mustela', key: 'mustela' },
              { label: 'A24 – WYFSTW', key: 'a24' },
              { label: 'Citroën ë–C3', key: 'citroen' },
              { label: 'Farcry 6', key: 'farcry' },
              { label: 'Perspective Fund', key: 'perspective' },
              { label: 'Martin Solveig', key: 'martin' },
              { label: 'Nope Collectif', key: 'collectif' },
              { label: 'Heiwa', key: 'heiwa' },
              { label: 'Alttta Curio', key: 'alttacurio' },
              { label: 'Mobil M', key: 'mobil' },
              { label: 'Nothing Ear', key: 'nothing' },
            ].map((item) => (
              <li
                key={item.label}
                onMouseEnter={() => {
                  const key = item.key
                  if (!key) return
                  const vid = document.getElementById(`vid-${key}`)
                  const cap = document.getElementById(`cap-${key}`)
                  if (!vid || !cap) return
                  document.querySelectorAll('video[id^="vid-"]').forEach((el) => {
                    el.pause(); el.currentTime = 0; el.style.opacity = '0'
                  })
                  document.querySelectorAll('div[id^="cap-"]').forEach((el) => {
                    el.style.opacity = '0'
                  })
                  vid.style.opacity = '1'; vid.play().catch(() => {})
                  cap.style.opacity = '1'
                }}
                onMouseLeave={() => {
                  const key = item.key
                  if (!key) return
                  const vid = document.getElementById(`vid-${key}`)
                  const cap = document.getElementById(`cap-${key}`)
                  if (!vid || !cap) return
                  vid.pause(); vid.currentTime = 0; vid.style.opacity = '0'
                  cap.style.opacity = '0'
                }}
                className={`cursor-${item.key ? 'pointer' : 'default'} ${item.key ? 'text-black' : 'text-black/30'} hover:translate-x-1 transition-transform cursor-pointer`}
              >
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
