type PageLoaderProps = { label?: string }
export default function PageLoader({ label = 'Chargement…' }: PageLoaderProps) {
  return <div className="empty" role="status" aria-live="polite">{label}</div>
}
