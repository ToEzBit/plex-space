import { useEffect, useRef } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

interface Props {
  terminalId: string
}

function PaneTerminal({ terminalId }: Props): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const term = new Terminal({ cursorBlink: true, fontSize: 14 })
    const fitAddon = new FitAddon()
    term.loadAddon(fitAddon)
    term.open(containerRef.current)
    fitAddon.fit()

    const removeDataListener = window.terminalAPI.onData((id, data) => {
      if (id === terminalId) term.write(data)
    })

    const dataDisposable = term.onData((data) => window.terminalAPI.input(terminalId, data))

    window.terminalAPI.create(terminalId)

    const el = containerRef.current
    const ro = new ResizeObserver(() => {
      fitAddon.fit()
      window.terminalAPI.resize(terminalId, term.cols, term.rows)
    })
    ro.observe(el)

    return () => {
      removeDataListener()
      dataDisposable.dispose()
      ro.disconnect()
      window.terminalAPI.destroy(terminalId)
      term.dispose()
    }
  }, [terminalId])

  return <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }} />
}

export default PaneTerminal
