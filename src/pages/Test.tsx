

export default function Test() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Teste de Instalação (PWA)</h1>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-semibold mb-2">📱 PWA (Progressive Web App)</h2>
          <p className="text-sm text-slate-600">
            PWA configurado! Para testar:
          </p>
          <ol className="list-decimal list-inside text-sm text-slate-600 mt-2 space-y-1">
            <li>Rode <code className="bg-slate-200 px-1 rounded">npm run build</code></li>
            <li>Rode <code className="bg-slate-200 px-1 rounded">npm run preview</code></li>
            <li>Abra o DevTools → Application → Service Workers</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
