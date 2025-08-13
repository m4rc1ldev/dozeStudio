import React, { useEffect, useRef, useState } from 'react'
import Header from './components/Header'
import Loader from './components/Loader'
import ProjectsSection from './components/ProjectsSection'
import Footer from './components/Footer'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from '@studio-freight/lenis'

gsap.registerPlugin(ScrollTrigger)

// Config
const FRAME_COUNT = 1345 // full set on disk (before exclusions)
const FRAMES_DIR = '/0fps'
const FILE_PREFIX = 'frame_'
const FILE_EXT = '.jpeg'

// Exclude multiple frame ranges (inclusive) from the sequence
const EXCLUDE_RANGES = [
  [532, 613],
  [614, 1192],
]
const FRAME_LIST = Array.from({ length: FRAME_COUNT }, (_, i) => i + 1).filter((n) =>
  !EXCLUDE_RANGES.some(([a, b]) => n >= a && n <= b),
)
const TOTAL_FRAMES = FRAME_LIST.length

// Sequence segmentation
const FRAMES_PER_SEGMENT = 50 // every 50 frames a new text/panel appears

const pad4 = (n) => String(n).padStart(4, '0')
const srcFor = (frameNumber) => `${FRAMES_DIR}/${FILE_PREFIX}${pad4(frameNumber)}${FILE_EXT}`
// Fit mode: 'cover' fills the screen (may crop). 'contain' shows full image (may letterbox).
const FIT_MODE = 'cover'

function App() {
  const canvasRef = useRef(null)
  const containerRef = useRef(null)
  const imagesRef = useRef([])
  // Track last drawn POSITION (index into FRAME_LIST)
  const lastDrawnIndexRef = useRef(null)
  const [progress, setProgress] = useState(0)
  const [showLoader, setShowLoader] = useState(true)
  const [allLoaded, setAllLoaded] = useState(false)

  // Loader UI refs
  const overlayRef = useRef(null)
  const _barRef = useRef(null)
  const _numberRef = useRef(null)
  const _dotsWrapRef = useRef(null)
  const _progressObj = useRef({ val: 0 })

  // UI overlay refs
  const bottomLeftRef = useRef(null)
  const textRefs = useRef([])
  const postTextRefs = useRef([])
  const panelRef = useRef(null)
  const prevSegmentRef = useRef(0)
  const projectsRef = useRef(null)
  const [headerDark, setHeaderDark] = useState(false)
  const [_hoverKey, _setHoverKey] = useState(null)

  // Clock
  const [clock, setClock] = useState('')
  const formatClock = () => {
    const d = new Date()
    const days = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA']
    const day = days[d.getDay()]
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${day}: ${hh}:${mm}`
  }
  useEffect(() => {
    setClock(formatClock())
    const id = setInterval(() => setClock(formatClock()), 1000)
    return () => clearInterval(id)
  }, [])

  // Draw image to canvas, CONTAIN (no cropping) while preserving aspect ratio
  // Uses CSS pixel coordinates (paired with DPR transform set in resizeCanvas)
  const drawImageContain = (ctx, img, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const cw = rect.width
    const ch = rect.height
    const iw = img.naturalWidth || img.width
    const ih = img.naturalHeight || img.height
    if (!iw || !ih || cw === 0 || ch === 0) return

    const cr = cw / ch
    const ir = iw / ih
    let w, h, x, y
    if (ir > cr) {
      // image is wider -> fit width
      w = cw
      h = w / ir
      x = 0
      y = (ch - h) / 2
    } else {
      // image is taller -> fit height
      h = ch
      w = h * ir
      y = 0
      x = (cw - w) / 2
    }
    ctx.clearRect(0, 0, cw, ch)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, x, y, w, h)
  }

  // Draw image to canvas, COVER (fill, allow cropping) while preserving aspect ratio
  // Uses CSS pixel coordinates (paired with DPR transform set in resizeCanvas)
  const drawImageCover = (ctx, img, canvas) => {
    const rect = canvas.getBoundingClientRect()
    const cw = rect.width
    const ch = rect.height
    const iw = img.naturalWidth || img.width
    const ih = img.naturalHeight || img.height
    if (!iw || !ih || cw === 0 || ch === 0) return

    const cr = cw / ch
    const ir = iw / ih
    let w, h, x, y
    if (ir > cr) {
      // image is wider -> fit height and crop sides
      h = ch
      w = h * ir
      y = 0
      x = (cw - w) / 2
    } else {
      // image is taller -> fit width and crop top/bottom
      w = cw
      h = w / ir
      x = 0
      y = (ch - h) / 2
    }
    ctx.clearRect(0, 0, cw, ch)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, x, y, w, h)
  }

  const drawByMode = (ctx, img, canvas) => {
    if (FIT_MODE === 'cover') return drawImageCover(ctx, img, canvas)
    return drawImageContain(ctx, img, canvas)
  }

  // Find the nearest loaded image by POSITION in FRAME_LIST
  const getNearestLoadedByPos = (pos) => {
    // search backwards including current
    for (let p = pos; p >= 0; p--) {
      const frameNum = FRAME_LIST[p]
      const img = imagesRef.current[frameNum]
      if (img && img.complete && img.naturalWidth > 0) return img
    }
    // then forwards
    for (let p = pos + 1; p < TOTAL_FRAMES; p++) {
      const frameNum = FRAME_LIST[p]
      const img = imagesRef.current[frameNum]
      if (img && img.complete && img.naturalWidth > 0) return img
    }
    return null
  }

  // Resize canvas to device pixel ratio
  const resizeCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const rect = canvas.getBoundingClientRect()
    canvas.width = Math.floor(rect.width * dpr)
    canvas.height = Math.floor(rect.height * dpr)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    // redraw last frame if possible
    const pos = lastDrawnIndexRef.current
    if (pos != null) {
      const img = getNearestLoadedByPos(pos)
      if (img) drawByMode(ctx, img, canvas)
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

  // Smooth scroll + timelines will be initialized after all frames load

    // Initial size
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

  // Preload frames with limited concurrency; wait for 100% before starting site
    const CONCURRENCY = 8
    let loaded = 0
    const totalToTrack = TOTAL_FRAMES

    // Preload first frame (first available in list) immediately
    const first = new Image()
    const firstFrameNum = FRAME_LIST[0]
    first.src = srcFor(firstFrameNum)
    imagesRef.current[firstFrameNum] = first
    first.decode?.().catch(() => {})
    first.onload = () => {
      const ctx = canvas.getContext('2d')
      drawByMode(ctx, first, canvas)
  loaded = 1
  setProgress(Math.round((loaded / totalToTrack) * 100))
  if (loaded >= totalToTrack) setAllLoaded(true)
    }

    const loadOne = (frameNum, cb) => {
      const img = new Image()
      img.src = srcFor(frameNum)
      imagesRef.current[frameNum] = img
      const done = () => {
        loaded += 1
        setProgress(Math.round((loaded / totalToTrack) * 100))
        if (loaded >= totalToTrack) setAllLoaded(true)
        cb && cb()
      }
      img.onload = done
      img.onerror = done
    }

    // Start from position 1 (position 0 preloaded above)
    let nextPos = 1
    const runNext = () => {
      const p = nextPos
      if (p >= TOTAL_FRAMES) return
      nextPos += 1
      const frameNum = FRAME_LIST[p]
      loadOne(frameNum, runNext)
    }
    for (let k = 0; k < CONCURRENCY; k++) runNext()

    // Ensure text blocks are centered via GSAP (avoid transform conflicts)
    if (textRefs.current?.length) {
      textRefs.current.forEach((el) => {
        if (!el) return
        gsap.set(el, {
          position: 'absolute',
          left: '50%',
          top: '50%',
          xPercent: -50,
          yPercent: -50,
          transformOrigin: '50% 50%',
          autoAlpha: 0,
          scale: 1,
        })
      })
    }
    if (postTextRefs.current?.length) {
      postTextRefs.current.forEach((el) => {
        if (!el) return
        gsap.set(el, {
          position: 'absolute',
          left: '50%',
          top: '50%',
          xPercent: -50,
          yPercent: -50,
          transformOrigin: '50% 50%',
          autoAlpha: 0,
          scale: 1,
        })
      })
    }

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      imagesRef.current = []
    }
  }, [])

  // Switch header color when projects (white) section is in view
  useEffect(() => {
    const el = projectsRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => setHeaderDark(entry.isIntersecting),
      { root: null, threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // Fade out loader only when ALL frames are loaded (100%)
  useEffect(() => {
    if (progress < 100 || !overlayRef.current) return
    gsap.to(overlayRef.current, {
      autoAlpha: 0,
      duration: 0.4,
      ease: 'power2.inOut',
      onComplete: () => setShowLoader(false),
    })
  }, [progress])

  // Loader entrance
  useEffect(() => {
    if (!showLoader || !overlayRef.current) return
    gsap.fromTo(overlayRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'power2.out' })
  }, [showLoader])

  // Disable scrolling while loader is visible to avoid jank before start
  useEffect(() => {
    if (showLoader) {
      const prev = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = prev
      }
    }
    document.body.style.overflow = ''
  }, [showLoader])

  // After all frames load, initialize Lenis + ScrollTrigger and timelines
  useEffect(() => {
    if (!allLoaded) return
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    // Init Lenis smooth scroll and sync with GSAP
    const lenis = new Lenis({
      duration: 0.95,
      smoothWheel: true,
      smoothTouch: false,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.1,
    })
    function raf(time) {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(raf)
    lenis.on('scroll', ScrollTrigger.update)

    // Initialize panel hidden off bottom
    if (panelRef.current) gsap.set(panelRef.current, { yPercent: 100, autoAlpha: 0, pointerEvents: 'none' })    // Helpers to avoid stacked overlays on fast scroll jumps
    const killTweensAndHideAll = () => {
      textRefs.current?.forEach((el) => el && gsap.killTweensOf(el))
      postTextRefs.current?.forEach((el) => el && gsap.killTweensOf(el))
      if (panelRef.current) gsap.killTweensOf(panelRef.current)
      textRefs.current?.forEach((el) => el && gsap.set(el, { autoAlpha: 0, scale: 1 }))
      postTextRefs.current?.forEach((el) => el && gsap.set(el, { autoAlpha: 0, scale: 1 }))
        if (panelRef.current) gsap.set(panelRef.current, { yPercent: 100, autoAlpha: 0, pointerEvents: 'none' })
    }
    const showSegment = (seg) => {
      // Always start by gracefully hiding all current overlays
      const prevSeg = prevSegmentRef.current
      
      // Fade out previous overlay before showing new one
      if (prevSeg >= 1 && prevSeg <= 7) {
        const prevEl = textRefs.current?.[prevSeg - 1]
        if (prevEl) gsap.to(prevEl, { autoAlpha: 0, scale: 0.985, duration: 0.25, ease: 'power1.out' })
      }
      if (prevSeg === 8 && panelRef.current) {
        gsap.to(panelRef.current, { yPercent: 100, autoAlpha: 0, duration: 0.4, ease: 'power2.inOut', onComplete: () => gsap.set(panelRef.current, { pointerEvents: 'none' }) })
      }
      if (prevSeg >= 9 && prevSeg <= 12) {
        const count = postTextRefs.current?.length || 0
        if (count > 0) {
          const idx = Math.min(prevSeg - 9, count - 1)
          const prevEl = postTextRefs.current?.[idx]
          if (prevEl) gsap.to(prevEl, { autoAlpha: 0, scale: 0.985, duration: 0.25, ease: 'power1.out' })
        }
      }

      // Show new segment after brief delay
      if (seg <= 0) return
      
      if (seg >= 1 && seg <= 7) {
        const el = textRefs.current?.[seg - 1]
        if (el) gsap.fromTo(el, { autoAlpha: 0, scale: 0.985 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power1.out', delay: 0.1 })
        return
      }
      if (seg === 8 && panelRef.current) {
        gsap.fromTo(panelRef.current, 
          { yPercent: 100, autoAlpha: 0 }, 
          { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'power2.out', delay: 0.1, onStart: () => gsap.set(panelRef.current, { pointerEvents: 'auto' }) }
        )
        return
      }
      if (seg >= 9 && seg <= 12) {
        const count = postTextRefs.current?.length || 0
        if (count > 0) {
          const idx = Math.min(seg - 9, count - 1)
          const el = postTextRefs.current?.[idx]
          if (el) gsap.fromTo(el, { autoAlpha: 0, scale: 0.985 }, { autoAlpha: 1, scale: 1, duration: 0.35, ease: 'power1.out', delay: 0.1 })
        }
        return
      }
    }

    // Scroll-driven animation
    const state = { pos: 0 }
    const tl = gsap.to(state, {
      pos: TOTAL_FRAMES - 1,
      ease: 'none',
      roundProps: 'pos',
      onUpdate: () => {
        const pos = state.pos
        if (pos === lastDrawnIndexRef.current) return
        const img = getNearestLoadedByPos(pos)
        if (!img) return
        const ctx = canvas.getContext('2d')
        drawByMode(ctx, img, canvas)
        lastDrawnIndexRef.current = pos

        const seg = Math.floor(pos / FRAMES_PER_SEGMENT)
        if (seg !== prevSegmentRef.current) {
          showSegment(seg)
          prevSegmentRef.current = seg
        }
      },
      scrollTrigger: {
        trigger: container,
        start: 'top top',
        end: '+=3200%',
        scrub: 0.2,
        pin: false,
      },
    })

    // Fade out center nav and bottom-left text after a small scroll
    const stBottom = gsap.to(bottomLeftRef.current, {
      autoAlpha: 0,
      y: 10,
      ease: 'none',
      scrollTrigger: {
        trigger: container,
        start: 'top+=80 top',
        end: '+=200',
        scrub: true,
      },
    })

    return () => {
      gsap.ticker.remove(raf)
      lenis.destroy()
      stBottom.scrollTrigger?.kill(); stBottom.kill()
      tl.scrollTrigger?.kill(); tl.kill()
    }
  }, [allLoaded])

  return (
    <div className="w-full bg-zinc-900 text-white">
      {/* Global header that persists across sections */}
  <Header headerDark={headerDark} clock={clock} />
      {/* Scroll area */}
  <div ref={containerRef} className="relative w-full h-[3400vh]">
        {/* Sticky viewport */}
        <div className="w-full sticky top-0 left-0 h-screen">
          <canvas ref={canvasRef} className="block w-full h-screen" />

          {/* UI Overlays */}
          <div className="pointer-events-none absolute inset-0">
            {/* Bottom-left tagline */}
            <div ref={bottomLeftRef} className="absolute bottom-6 left-6 max-w-[90vw] text-left">
              <div className="text-sm sm:text-3xl font-thin opacity-80">© {new Date().getFullYear()} DOZE.STD</div>
              <div className="mt-1 text-base sm:text-3xl font-semibold tracking-wide">
                SHAPING BRANDS → CRAFTING MOTION →
              </div>
            </div>
          </div>


            {/* Sequential text blocks (1..7) */}
            <div className="absolute inset-0">
                {[ 
                  {
                    title: 'transforming visions',
                    body: 'Building identity and insipiring actions. Sculpting digital expert resonate.',
                  },
                  {
                    title: 'Elevating Aesthetics',
                    body: 'Crafting solutions and exploring new horizons. Evolving narratives and elevating aesthetics in every project.',
                  },
                  { title: 'Designing Clarity', body: 'Translating ideas into clear, refined visuals that communicate with intent.' },
                  { title: 'Narrative-Driven', body: 'Weaving stories through motion and brand systems that connect and endure.' },
                  { title: 'Precision & Play', body: 'Balancing rigor with exploration to shape confident, distinct identities.' },
                  { title: 'Systems That Scale', body: 'From concept to product, building design languages that grow with you.' },
                  { title: 'Impactful Moments', body: 'Delighting through details—microinteractions that elevate the experience.' },
                ].map((b, i) => (
                  <div
                    key={i}
                    ref={(el) => (textRefs.current[i] = el)}
                    className="pointer-events-none absolute left-1/2 top-1/2 text-center px-6 max-w-4xl opacity-0"
                  >
            <h2 className="text-4xl sm:text-6xl md:text-7xl font-semibold leading-tight capitalize">{b.title}</h2>
            <p className="mt-4 text-lg sm:text-xl opacity-90 leading-relaxed">{b.body}</p>
                  </div>
                ))}
              </div>

              {/* 8th sliding panel */}
              <div
                ref={panelRef}
                className="panel absolute right-0 top-0 z-[30] h-screen w-full hidden md:flex md:w-2/3 lg:w-1/2 xl:w-2/5 bg-white text-black p-6 sm:p-8 lg:p-10 shadow-2xl overflow-y-auto flex-col opacity-0 pointer-events-none"
              >
                <h3 className="panelelem text-base sm:text-lg md:text-xl font-[100]">© 2024 Doze.Std</h3>
                <p className="panelelem mt-6 sm:mt-8 lg:mt-10 text-base sm:text-lg md:text-xl">
                  Sculpting Digital
                  <br />
                  Transforming visions into digital realities. Weaving stories that captivate and innovate.
                  <br />
                  Exploring new possibilities with a focus on narrative evolution. Crafting solutions that engage and elevate.
                </p>
                <button className="panelelem border-[1px] px-3 py-2 border-[#555] font-[100] mt-6 text-sm sm:text-base">Get Reviews</button>

                <div className="panelelem mt-auto pt-6 sm:pt-8">
                  <h3 className="text-lg sm:text-xl">Innovating Design</h3>
                  <p className="text-xs sm:text-sm mt-3">
                    Connecting ideas to foster creativity. Designing impactful experiences that resonate.
                    <br />
                    Feel free to mix and match these sections to suit your website's design needs!
                  </p>
                  <button className="bg-black text-white px-7 text-sm mt-4 py-4 font-[100] capitalize">experience</button>
                </div>
              </div>
          {/* Post-panel centered texts (segments 9..12) over canvas */}
          <div className="pointer-events-none absolute inset-0">
            {[
              { title: 'Adaptive by Design', body: 'Systems that flex with context, scale with ambition, and stay coherent.' },
              { title: 'Motion as Language', body: 'Intentional movement that communicates brand, not just decorates it.' },
              
            ].map((b, i) => (
              <div key={i} ref={(el) => (postTextRefs.current[i] = el)} className="absolute left-1/2 top-1/2 px-6 max-w-4xl text-center opacity-0">
                <h2 className="text-4xl sm:text-6xl md:text-7xl font-semibold leading-tight">{b.title}</h2>
                <p className="mt-4 text-lg sm:text-xl opacity-90 leading-relaxed">{b.body}</p>
              </div>
            ))}
          </div>

          {/* Loading overlay (animated) */}
          {showLoader && (
            <div ref={overlayRef}>
              <Loader progress={progress} />
            </div>
          )}
        </div>
      </div>
      <div ref={projectsRef}>
        <ProjectsSection />
      </div>
  <Footer />
    </div>
  )
}

export default App