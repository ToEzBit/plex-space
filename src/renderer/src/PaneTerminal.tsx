import { useState, useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const XTERM_THEME = {
  background: '#0B1120',
  foreground: '#E2E8F0',
  cursor: '#2CF9ED',
  cursorAccent: '#04141A',
  selectionBackground: 'rgba(44, 249, 237, 0.25)',
  black: '#11192B',
  brightBlack: '#475569',
  red: '#FF6B7A',
  brightRed: '#FF8A96',
  green: '#35E0A6',
  brightGreen: '#5DEFBE',
  yellow: '#F5C45E',
  brightYellow: '#FAD584',
  blue: '#7DD3FC',
  brightBlue: '#A5E0FF',
  magenta: '#C4B5FD',
  brightMagenta: '#DDD0FF',
  cyan: '#2CF9ED',
  brightCyan: '#6FFBF2',
  white: '#E2E8F0',
  brightWhite: '#F8FAFC'
}

function fitAndResize(
  fit: FitAddon,
  term: Terminal,
  lastSizeRef: { current: { cols: number; rows: number } | null },
  terminalId: string
): void {
  fit.fit()
  const { cols, rows } = term
  const last = lastSizeRef.current
  if (!last || last.cols !== cols || last.rows !== rows) {
    lastSizeRef.current = { cols, rows }
    window.terminalAPI.resize(terminalId, cols, rows)
  }
}

interface Props {
  terminalId: string
  visible: boolean
  isDragging?: boolean
  refitTrigger?: number
}

function PaneTerminal({ terminalId, visible, isDragging, refitTrigger }: Props): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const isDraggingRef = useRef(false)
  const lastSizeRef = useRef<{ cols: number; rows: number } | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)

  isDraggingRef.current = isDragging ?? false

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    if (!isDragOver) setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>): void => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return
    setIsDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>): Promise<void> => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return

    if (files.length === 1 && files[0].type.startsWith('image/')) {
      const filePath = window.terminalAPI.getPathForFile(files[0])
      await window.terminalAPI.writeImageToClipboard(filePath)
      termRef.current?.paste('')
      return
    }

    const paths = files
      .map((f) => window.terminalAPI.getPathForFile(f).replace(/ /g, '\\ '))
      .join(' ')
    window.terminalAPI.input(terminalId, paths + ' ')
  }

  useEffect(() => {
    if (!containerRef.current) return

    const fontFamily = getComputedStyle(document.documentElement).getPropertyValue('--font-mono').trim()
    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily,
      theme: XTERM_THEME,
      scrollback: 5000
    })
    const fitAddon = new FitAddon()
    termRef.current = term
    fitAddonRef.current = fitAddon

    let mounted = true
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    document.fonts.ready.then(() => {
      if (!mounted) return
      fitAddon.fit()
      window.terminalAPI.resize(terminalId, term.cols, term.rows)
    })

    const removeDataListener = window.terminalAPI.onData((id, data) => {
      if (id === terminalId) term.write(data)
    })

    const dataDisposable = term.onData((data) => window.terminalAPI.input(terminalId, data))

    const el = containerRef.current
    let rafId = 0
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => {
        if (isDraggingRef.current) return
        if (el.offsetWidth > 0 && el.offsetHeight > 0) {
          fitAndResize(fitAddon, term, lastSizeRef, terminalId)
        }
      })
    })
    ro.observe(el)

    return () => {
      mounted = false
      cancelAnimationFrame(rafId)
      removeDataListener()
      dataDisposable.dispose()
      ro.disconnect()
      term.dispose()
      termRef.current = null
      fitAddonRef.current = null
    }
  }, [terminalId])

  useEffect(() => {
    if (!visible) return
    requestAnimationFrame(() => {
      const fit = fitAddonRef.current
      const term = termRef.current
      if (fit && term) fitAndResize(fit, term, lastSizeRef, terminalId)
    })
  }, [visible, terminalId])

  useEffect(() => {
    if (!refitTrigger) return
    requestAnimationFrame(() => {
      const fit = fitAddonRef.current
      const term = termRef.current
      if (fit && term) fitAndResize(fit, term, lastSizeRef, terminalId)
    })
  }, [refitTrigger, terminalId])

  return (
    <div
      ref={containerRef}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        outline: isDragOver ? '2px solid var(--accent)' : undefined,
        outlineOffset: isDragOver ? '-2px' : undefined
      }}
    />
  )
}

export default PaneTerminal
