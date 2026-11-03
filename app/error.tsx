'use client';
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="center"><div className="eyebrow">O CAMINHO SE INTERROMPEU</div><h1>Uma pausa<br/><em>na névoa.</em></h1><p>Não foi possível abrir esta página. Tente novamente para continuar.</p><button className="primary" onClick={reset}>Tentar novamente</button></main>}
