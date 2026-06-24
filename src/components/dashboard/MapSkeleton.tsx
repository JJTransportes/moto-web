export default function MapSkeleton() {
  return (
    <div
      className="flex w-full items-center justify-center rounded-xl bg-slate-100 animate-pulse"
      style={{ minHeight: '500px' }}
    >
      <div className="text-center">
        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
        <p className="text-sm text-slate-500">Carregando mapa...</p>
      </div>
    </div>
  )
}
