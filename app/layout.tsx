import './style.css';
import type {Metadata} from 'next';
import Link from 'next/link';
export const metadata:Metadata={title:'Ecos de Ballynyr',description:'Algumas histórias começam antes de serem contadas.',robots:{index:false,follow:false}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><a className="skip-link" href="#content">Pular para o conteúdo</a><header className="site-header"><Link href="/" aria-label="Ecos de Ballynyr, início"><span aria-hidden="true">✦</span> BALLYNYR</Link><span>CRÔNICAS À LUZ DE VELAS</span></header><div id="content">{children}</div></body></html>}
