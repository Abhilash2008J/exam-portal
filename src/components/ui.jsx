import { AlertCircle, Check, LoaderCircle, X } from 'lucide-react';

const variants = {
  primary: 'bg-cobalt text-white hover:bg-[#2447b8] shadow-sm',
  secondary: 'bg-white text-ink border border-[#e7e4dc] hover:border-cobalt/40 hover:bg-[#fbfaf8]',
  quiet: 'text-[#536071] hover:bg-[#f0eee8]',
  danger: 'bg-[#a84247] text-white hover:bg-[#87373b]',
};

export function Button({ variant = 'primary', className = '', children, ...props }) {
  return <button className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`} {...props}>{children}</button>;
}

export function Card({ className = '', children }) {
  return <section className={`rounded-2xl border border-[#e9e6de] bg-white shadow-soft ${className}`}>{children}</section>;
}

export function Eyebrow({ children, className = '' }) {
  return <div className={`mb-2 text-[11px] font-bold uppercase tracking-[.16em] text-[#758092] ${className}`}>{children}</div>;
}

export function PageHeading({ eyebrow, title, description, action }) {
  return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div>{eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}<h1 className="font-display text-3xl tracking-tight text-ink sm:text-[2.5rem]">{title}</h1>{description && <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6b7482]">{description}</p>}</div>{action}</div>;
}

export function Notice({ type = 'info', title, children }) {
  const styles = type === 'error' ? 'border-rose-200 bg-rose-50 text-rose-800' : type === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-[#dce3f6] bg-[#f2f5ff] text-[#31477d]';
  const Icon = type === 'error' ? AlertCircle : type === 'success' ? Check : AlertCircle;
  return <div role={type === 'error' ? 'alert' : 'status'} className={`flex gap-3 rounded-xl border px-4 py-3 text-sm leading-6 ${styles}`}><Icon size={18} className="mt-0.5 shrink-0" /><div>{title && <div className="font-semibold">{title}</div>}{children}</div></div>;
}

export function LoadingScreen({ label = 'Loading' }) {
  return <div className="flex min-h-[55vh] flex-col items-center justify-center gap-3 text-sm text-[#738091]"><LoaderCircle className="animate-spin text-cobalt" size={24} /><span>{label}</span></div>;
}

export function EmptyState({ icon: Icon, title, children, action }) {
  return <div className="flex flex-col items-center px-6 py-14 text-center"><div className="mb-4 rounded-2xl bg-[#f2f0eb] p-3 text-[#667387]">{Icon && <Icon size={22} />}</div><h3 className="font-semibold text-ink">{title}</h3><p className="mt-2 max-w-sm text-sm leading-6 text-[#748091]">{children}</p>{action && <div className="mt-5">{action}</div>}</div>;
}

export function Modal({ title, children, onClose, footer }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#162135]/45 p-4" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose?.()}><section role="dialog" aria-modal="true" aria-labelledby="modal-title" className="w-full max-w-md rounded-2xl border border-[#e7e4dc] bg-white p-6 shadow-2xl soft-enter"><div className="mb-4 flex items-start justify-between gap-4"><h2 id="modal-title" className="font-display text-2xl text-ink">{title}</h2><button aria-label="Close dialog" onClick={onClose} className="rounded-lg p-1.5 text-[#748091] hover:bg-paper"><X size={18} /></button></div><div>{children}</div>{footer && <div className="mt-6 flex justify-end gap-2">{footer}</div>}</section></div>;
}
