import type { ClientMessage } from '../bridge/types'

interface Props {
  label: string
  message: ClientMessage
  send: (msg: ClientMessage) => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}

export function CommandButton({ label, message, send, disabled = false, variant = 'primary' }: Props) {
  return (
    <button
      className={`cmd-button cmd-button--${variant}`}
      disabled={disabled}
      onClick={() => send(message)}
    >
      {label}
    </button>
  )
}
