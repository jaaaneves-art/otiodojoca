import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Globe2, HeartHandshake, Network, ShieldCheck, Users } from "lucide-react";
import { DiasporaExplorer, type DiasporaEntry } from "@/components/diaspora/diaspora-explorer";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Diáspora | O Tio do Joca",
  description: "A rede que liga portugueses, associações, empresários e empresas às freguesias, concelhos e famílias de origem.",
};

const previewEntries: DiasporaEntry[] = [
  { id: "preview-1", name: "Casa de Portugal", kind: "associacao", city: "Luxemburgo", country: "Luxemburgo", parish: "Arouca", municipality: "Arouca", description: "Cultura, língua portuguesa e apoio à comunidade.", verified: true },
  { id: "preview-2", name: "Sabores da Nossa Terra", kind: "empresa", city: "Lyon", country: "França", parish: "Castelões", municipality: "Penafiel", description: "Produtos portugueses e encontro semanal da comunidade." },
  { id: "preview-3", name: "Manuel Ferreira", kind: "empresario", city: "Toronto", country: "Canadá", parish: "Arões", municipality: "Fafe", description: "Construção civil e mentoria para novos empresários portugueses.", verified: true },
];

export default function DiasporaPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.back}><ArrowLeft size={17} /> O Tio do Joca</Link>
        <span>Diáspora</span><span className={styles.badge}>Da terra para o mundo</span>
      </header>
      <section className={styles.hero}>
        <div><p className={styles.eyebrow}><Globe2 size={18} /> A nossa terra não acaba na fronteira</p><h1>Longe no mapa.<br/><em>Perto das raízes.</em></h1><p className={styles.lead}>Um ponto de encontro para portugueses no estrangeiro, associações, empresários e empresas — ligado à freguesia, ao concelho e à família, nos dois sentidos.</p><div className={styles.actions}><a href="#diretorio">Explorar a comunidade <ArrowRight size={17}/></a><Link href="/registo">Criar ligação</Link></div></div>
        <div className={styles.orbit} aria-label="Ligação entre Portugal e a diáspora"><div className={styles.portugal}>PT<span>Portugal</span></div><span className={styles.routeOne}/><span className={styles.routeTwo}/><div className={`${styles.city} ${styles.cityOne}`}>Paris</div><div className={`${styles.city} ${styles.cityTwo}`}>Luxemburgo</div><div className={`${styles.city} ${styles.cityThree}`}>Toronto</div></div>
      </section>
      <section className={styles.pillars} aria-label="Áreas da Diáspora">
        <article><Users/><h2>Associações</h2><p>Diretório, atividades, eventos, serviços e contacto com a comunidade local.</p></article>
        <article><Building2/><h2>Empresas e empresários</h2><p>Visibilidade, oportunidades, parcerias, emprego e produtos portugueses.</p></article>
        <article><Network/><h2>Terra de origem</h2><p>Ligação confirmada à freguesia e ao concelho, com notícias e iniciativas locais.</p></article>
        <article><HeartHandshake/><h2>Família</h2><p>Laços privados e consentidos, sem expor relações ou dados pessoais.</p></article>
      </section>
      <section className={styles.twoWay}><div><p>Uma ponte de dois sentidos</p><h2>O mundo chega à freguesia.<br/>A freguesia chega ao mundo.</h2></div><ol><li><b>1</b><span><strong>Descobrir</strong> pessoas, coletividades e negócios por país ou terra de origem.</span></li><li><b>2</b><span><strong>Participar</strong> em eventos, campanhas, projetos e oportunidades locais.</span></li><li><b>3</b><span><strong>Contribuir</strong> com conhecimento, investimento, emprego, cultura e solidariedade.</span></li></ol></section>
      <DiasporaExplorer entries={previewEntries}/>
      <section className={styles.trust}><ShieldCheck/><div><h2>Confiança desde o primeiro contacto</h2><p>Perfis com visibilidade controlável, organizações verificadas, moderação, consentimento explícito nas ligações familiares e proteção dos dados pessoais.</p></div></section>
      <section className={styles.cta}><p>Há sempre um caminho de regresso.</p><h2>Crie a sua ligação a Portugal.</h2><Link href="/registo">Juntar-me à Diáspora <ArrowRight size={17}/></Link></section>
    </main>
  );
}
