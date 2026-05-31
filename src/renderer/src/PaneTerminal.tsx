import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface Props {
  terminalId: string
  visible: boolean
}

function PaneTerminal({ terminalId, visible }: Props): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: "'JetBrainsMono NFM', ui-monospace, Menlo, monospace"
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
        if (el.offsetWidth > 0 && el.offsetHeight > 0) {
          fitAddon.fit()
          window.terminalAPI.resize(terminalId, term.cols, term.rows)
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
      if (fit && term) {
        fit.fit()
        window.terminalAPI.resize(terminalId, term.cols, term.rows)
      }
    })
  }, [visible, terminalId])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />
}

export default PaneTerminal
