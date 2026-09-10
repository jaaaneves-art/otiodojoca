import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  HeartHandshake,
  Home,
  MapPin,
  Megaphone,
  PawPrint,
  Search,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import styles from "./page.module.css";
import { createClient } from "@/lib/supabase/server";
import { PetCard } from "@/components/pets/pet-card";
import type { PetPost } from "@/lib/pets/types";

export const metadata: Metadata = {
  title: "Mundo dos Patudos | O Tio do Joca",
  description:
    "Uma comunidade local para adoção responsável, animais perdidos e pedidos de ajuda.",
};

const paths = [
  {
    icon: Home,
    tag: "Uma família para sempre",
    title: "Adotar",
    text: "Conhece animais que procuram uma casa e inicia uma adoção responsável perto de ti.",
    action: "Ver animais",
    href: "/mundo-dos-patudos/casos?kind=adoption",
    accent: "coral",
  },
  {
    icon: Search,
    tag: "Cada minuto conta",
    title: "Perdidos e encontrados",
    text: "Publica um alerta local e mobiliza rapidamente pessoas da freguesia e arredores.",
    action: "Consultar alertas",
    href: "/mundo-dos-patudos/casos?kind=lost",
    accent: "yellow",
  },
  {
    icon: HeartHandshake,
    tag: "Uma rede que cuida",
    title: "Pedir ajuda",
    text: "Liga necessidades urgentes a associações, protetores e pessoas disponíveis para ajudar.",
    action: "Conhecer a rede",
    href: "/mundo-dos-patudos/casos?kind=help",
    accent: "mint",
  },
];

export default async function MundoDosPatudosPage() {
  const supabase = await createClient();
  const [{ data: recentData }, { data: { user } }] = await Promise.all([
    supabase.from("pet_posts")
      .select("*,freguesia:freguesias(nome,municipio),pet_photos(id,storage_path,sort_order)")
      .in("status", ["published", "resolved"])
      .order("is_urgent", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(6),
    supabase.auth.getUser(),
  ]);
  const recent = (recentData ?? []) as unknown as PetPost[];
  const withPhotoUrls = recent.map((post) => ({
    post,
    photoUrl: post.pet_photos?.[0]
      ? supabase.storage.from("pet-media").getPublicUrl(post.pet_photos[0].storage_path).data.publicUrl
      : undefined,
  }));
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.back} href="/">
          <ArrowLeft size={17} aria-hidden="true" />
          <span>O Tio do Joca</span>
        </Link>
        <div className={styles.wordmark}><PawPrint size={18} aria-hidden="true" /> Mundo dos Patudos</div>
        <Link className={styles.status} href={user ? "/mundo-dos-patudos/publicar" : "/login"}>Publicar</Link>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>A comunidade de quem deixa pegadas em nós</p>
          <h1>
            Nenhum patudo
            <span>fica para trás.</span>
          </h1>
          <p className={styles.heroText}>
            Adoção responsável, alertas de animais perdidos e uma rede local de ajuda.
            Tudo começa na freguesia — onde as pessoas ainda se conhecem.
          </p>
          <div className={styles.actions}>
            <Link className={styles.primaryAction} href="/mundo-dos-patudos/casos">
              Explorar a comunidade <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <a className={styles.secondaryAction} href="#rede">
              Para associações
            </a>
          </div>
        </div>

        <div className={styles.heroArt} aria-label="Ilustração abstrata de um animal rodeado pela comunidade">
          <div className={styles.orbitOne} aria-hidden="true" />
          <div className={styles.orbitTwo} aria-hidden="true" />
          <div className={styles.bigPaw} aria-hidden="true">
            <span className={styles.pad} />
            <span className={`${styles.toe} ${styles.toeOne}`} />
            <span className={`${styles.toe} ${styles.toeTwo}`} />
            <span className={`${styles.toe} ${styles.toeThree}`} />
            <span className={`${styles.toe} ${styles.toeFour}`} />
          </div>
          <div className={`${styles.floatingTag} ${styles.tagOne}`}><MapPin size={15} /> Perto de ti</div>
          <div className={`${styles.floatingTag} ${styles.tagTwo}`}><ShieldCheck size={15} /> Adoção responsável</div>
          <div className={`${styles.floatingTag} ${styles.tagThree}`}><Users size={15} /> Comunidade local</div>
          <div className={styles.pawTrail} aria-hidden="true">●　●　●</div>
        </div>
      </section>

      <section className={styles.quickBar} aria-label="Compromissos da comunidade">
        <p><ShieldCheck size={18} /> Bem-estar primeiro</p>
        <p><MapPin size={18} /> Resposta local</p>
        <p><HeartHandshake size={18} /> Entreajuda real</p>
        <p><BellRing size={18} /> Alertas rápidos</p>
      </section>

      <section className={styles.pathsSection} id="comecar">
        <div className={styles.sectionIntro}>
          <p className={styles.sectionLabel}>Escolhe por onde começar</p>
          <h2>Três caminhos.<br />A mesma vontade de cuidar.</h2>
        </div>
        <div className={styles.pathGrid}>
          {paths.map((path, index) => {
            const Icon = path.icon;
            return (
              <article className={`${styles.pathCard} ${styles[path.accent]}`} key={path.title}>
                <div className={styles.cardTop}>
                  <span className={styles.cardNumber}>0{index + 1}</span>
                  <span className={styles.cardIcon}><Icon size={25} aria-hidden="true" /></span>
                </div>
                <p className={styles.cardTag}>{path.tag}</p>
                <h3>{path.title}</h3>
                <p className={styles.cardText}>{path.text}</p>
                <Link className={styles.cardAction} href={path.href}>{path.action} <ArrowRight size={16} /></Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className={styles.alertSection}>
        <div className={styles.alertVisual} aria-hidden="true">
          <div className={styles.mapGrid} />
          <div className={styles.radiusOne} />
          <div className={styles.radiusTwo} />
          <div className={styles.mapPin}><PawPrint size={28} /></div>
          <span className={`${styles.mapDot} ${styles.mapDotOne}`} />
          <span className={`${styles.mapDot} ${styles.mapDotTwo}`} />
          <span className={`${styles.mapDot} ${styles.mapDotThree}`} />
        </div>
        <div className={styles.alertCopy}>
          <p className={styles.sectionLabel}>Alertas da comunidade</p>
          <h2>Perdeu-se aqui.<br />Procura-se primeiro aqui.</h2>
          <p>
            Um alerta associado à freguesia ajuda a chegar depressa às pessoas que
            realmente podem ver o animal. Depois, o alcance poderá ser alargado aos
            concelhos vizinhos sempre que necessário.
          </p>
          <div className={styles.alertSteps}>
            <span><strong>01</strong> Publicar informação e localização</span>
            <span><strong>02</strong> Avisar a comunidade próxima</span>
            <span><strong>03</strong> Atualizar quando regressar a casa</span>
          </div>
        </div>
      </section>

      <section className={styles.networkSection} id="rede">
        <div className={styles.networkHeading}>
          <p className={styles.sectionLabel}>A rede dos Patudos</p>
          <h2>Há muitas maneiras<br />de fazer a diferença.</h2>
          <p>
            Associações, protetores, famílias de acolhimento e profissionais poderão
            trabalhar em conjunto, mantendo cada pedido ligado à sua comunidade.
          </p>
        </div>
        <div className={styles.networkList}>
          <div><span><Users size={21} /></span><div><h3>Associações e protetores</h3><p>Perfis verificados e pedidos organizados.</p></div></div>
          <div><span><Home size={21} /></span><div><h3>Famílias de acolhimento</h3><p>Ajuda temporária até surgir uma solução segura.</p></div></div>
          <div><span><Stethoscope size={21} /></span><div><h3>Rede de cuidados</h3><p>Apoio veterinário e necessidades urgentes.</p></div></div>
          <div><span><Megaphone size={21} /></span><div><h3>Voluntários locais</h3><p>Partilha, transporte e resposta no terreno.</p></div></div>
        </div>
      </section>

      <section className={styles.principlesSection}>
        <p className={styles.sectionLabel}>Antes de tudo</p>
        <h2>O animal não é um anúncio.<br /><span>É uma responsabilidade.</span></h2>
        <div className={styles.principles}>
          <p>Sem promoção de criação irresponsável.</p>
          <p>Sem entregas sem verificação mínima.</p>
          <p>Com regras claras de bem-estar e segurança.</p>
        </div>
      </section>

      <section className={styles.liveSection}>
        <div className={styles.liveHeading}>
          <div><p className={styles.sectionLabel}>A acontecer agora</p><h2>Casos da comunidade</h2></div>
          <Link href={user ? "/mundo-dos-patudos/publicar" : "/login"}>Criar publicação <ArrowRight size={16} /></Link>
        </div>
        {withPhotoUrls.length ? (
          <div className={styles.liveGrid}>{withPhotoUrls.map(({ post, photoUrl }) => <PetCard key={post.id} post={post} photoUrl={photoUrl} />)}</div>
        ) : (
          <div className={styles.emptyState}><PawPrint size={34} /><h3>A comunidade começa contigo.</h3><p>Ainda não há casos publicados nesta versão.</p><Link href={user ? "/mundo-dos-patudos/publicar" : "/login"}>Fazer a primeira publicação</Link></div>
        )}
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerBrand}><PawPrint size={20} /> Mundo dos Patudos</div>
        <p>Uma comunidade de O Tio do Joca</p>
        <span>Projeto em desenvolvimento</span>
      </footer>
    </main>
  );
}
