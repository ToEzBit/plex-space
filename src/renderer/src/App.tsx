import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const TERMINAL_ID = 'terminal-1'

function App(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({ cursorBlink: true, fontSize: 14 })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    const removeDataListener = window.terminalAPI.onData((id, data) => {
      if (id === TERMINAL_ID) term.write(data)
    })

    const dataDisposable = term.onData((data) => window.terminalAPI.input(TERMINAL_ID, data))

    window.terminalAPI.create(TERMINAL_ID)

    const ro = new ResizeObserver(() => {
      fitAddon.fit()
      window.terminalAPI.resize(TERMINAL_ID, term.cols, term.rows)
    })
    ro.observe(containerRef.current)

    return () => {
      removeDataListener()
      dataDisposable.dispose()
      ro.disconnect()
      window.terminalAPI.destroy(TERMINAL_ID)
      term.dispose()
    }
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#1e1e1e', padding: '4px' }}>
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  )
}

export default App
