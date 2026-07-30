import clsx from 'clsx'

export function Card({ className, children, ...props }) {
  return (
    <div
      className={clsx(
        'bg-paper border border-line rounded-lg shadow-[0_1px_2px_rgba(20,33,61,0.06)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ eyebrow, title, action, className }) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 px-5 pt-5 pb-3', className)}>
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold tracking-wider text-gold uppercase mb-1">{eyebrow}</p>
        )}
        {title && <h3 className="font-display text-lg font-semibold text-ink">{title}</h3>}
      </div>
      {action}
    </div>
  )
}

const buttonVariants = {
  primary: 'bg-ink text-parchment hover:bg-ink-light',
  gold: 'bg-gold text-white hover:bg-gold-light',
  outline: 'border border-line text-ink bg-paper hover:bg-parchment-dark',
  ghost: 'text-ink hover:bg-parchment-dark',
  danger: 'bg-danger text-white hover:opacity-90',
}

export function Button({ variant = 'primary', className, children, disabled, ...props }) {
  return (
    <button
      disabled={disabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        buttonVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

const stampStyles = {
  en_attente: 'text-warning border-warning bg-warning-bg',
  acceptee: 'text-success border-success bg-success-bg',
  refusee: 'text-danger border-danger bg-danger-bg',
  eligible: 'text-info border-info bg-info-bg',
  proposee: 'text-info border-info bg-info-bg',
  validee: 'text-success border-success bg-success-bg',
  terminee: 'text-slate border-slate bg-parchment-dark',
  archivee: 'text-slate border-slate bg-parchment-dark',
}

const stampLabels = {
  en_attente: 'En attente',
  acceptee: 'Acceptée',
  refusee: 'Refusée',
  eligible: 'Éligible',
  proposee: 'Proposée',
  validee: 'Validée',
  terminee: 'Terminée',
  archivee: 'Archivée',
}

/** Badge "tampon officiel" — signature visuelle du dossier académique. */
export function StatusStamp({ status, label }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        stampStyles[status] || 'text-slate border-line bg-parchment-dark'
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {label || stampLabels[status] || status}
    </span>
  )
}

export function Spinner({ className }) {
  return (
    <div
      className={clsx(
        'h-5 w-5 animate-spin rounded-full border-2 border-line border-t-gold',
        className
      )}
    />
  )
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-parchment-dark text-slate">
          <Icon size={22} />
        </div>
      )}
      <div>
        <p className="font-display font-semibold text-ink">{title}</p>
        {description && <p className="text-sm text-slate mt-1 max-w-sm">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Field({ label, required, error, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label} {required && <span className="text-gold">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-slate">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  )
}

export function Input({ className, ...props }) {
  return (
    <input
      className={clsx(
        'w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-slate/60',
        'focus:border-academic focus:outline-none focus:ring-2 focus:ring-academic/20',
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={clsx(
        'w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-slate/60',
        'focus:border-academic focus:outline-none focus:ring-2 focus:ring-academic/20',
        className
      )}
      {...props}
    />
  )
}

export function Select({ className, children, ...props }) {
  return (
    <select
      className={clsx(
        'w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink',
        'focus:border-academic focus:outline-none focus:ring-2 focus:ring-academic/20',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function Alert({ variant = 'info', children }) {
  const styles = {
    info: 'bg-info-bg text-info border-info/30',
    success: 'bg-success-bg text-success border-success/30',
    danger: 'bg-danger-bg text-danger border-danger/30',
    warning: 'bg-warning-bg text-warning border-warning/30',
  }
  return (
    <div className={clsx('rounded-md border px-4 py-3 text-sm', styles[variant])}>{children}</div>
  )
}

export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-lg bg-paper shadow-xl border border-line">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="font-display font-semibold text-ink">{title}</h3>
          <button onClick={onClose} className="text-slate hover:text-ink text-xl leading-none">
            &times;
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function ProgressRing({ value, max, size = 56, colorClass = 'text-gold' }) {
  const radius = (size - 8) / 2
  const circumference = 2 * Math.PI * radius
  const ratio = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circumference * (1 - ratio)
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth="6" className="stroke-line" fill="none" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={clsx('transition-all duration-500', colorClass)}
          stroke="currentColor"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-ink">
        {value}/{max}
      </div>
    </div>
  )
}
