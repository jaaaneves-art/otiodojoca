import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  BookHeart,
  Building2,
  CalendarDays,
  Camera,
  Globe2,
  Heart,
  MapPin,
  MessageCircleHeart,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Rua da Saudade | O Tio do Joca",
  description:
    "Anúncios fúnebres, cerimónias e livros digitais de condolências ligados à comunidade local.",
};

const reachLevels = [
  { name: "Freguesia", note: "Sempre gratuito", free: true },
  { name: "Concelho", note: "Valor a definir" },
  { name: "Distrito", note: "Valor a definir" },
  { name: "Nacional", note: "Valor a definir" },
  { name: "Internacional", note: "Valor a definir" },
];

export default function RuaDaSaudadePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.back} href="/" aria-label="Voltar à entrada de O Tio do Joca">
          <ArrowLeft size={17} aria-hidden="true" />
          <span>O Tio do Joca</span>
        </Link>
        <span className={styles.headerName}>Rua da Saudade</span>
        <span className={styles.preview}>Em preparação</span>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Uma rua feita de memória</p>
          <h1>
            Cada vida deixa
            <span>uma luz acesa.</span>
          </h1>
          <p className={styles.heroText}>
            Um lugar sereno onde as agências funerárias informam a comunidade,
            e onde familiares e amigos podem estar presentes — mesmo à distância.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryAction} href="#agencias">
              Área para agências <ArrowRight size={17} aria-hidden="true" />
            </a>
            <a className={styles.secondaryAction} href="#como-funciona">
              Conhecer o serviço
            </a>
          </div>
        </div>

        <div className={styles.streetScene} aria-label="Representação visual da Rua da Saudade">
          <div className={styles.moon} aria-hidden="true" />
          <div className={styles.stars} aria-hidden="true">✦ · ✦</div>
          <div className={styles.houseRow} aria-hidden="true">
            <div className={`${styles.house} ${styles.houseSmall}`}><span /></div>
            <div className={`${styles.house} ${styles.houseTall}`}><span /></div>
            <div className={`${styles.house} ${styles.houseMain}`}><span /></div>
            <div className={`${styles.house} ${styles.houseSmall}`}><span /></div>
          </div>
          <article className={styles.noticePreview}>
            <div className={styles.noticeFlame} aria-hidden="true"><span /></div>
            <p className={styles.noticeType}>Em memória</p>
            <p className={styles.noticeName}>Nome da pessoa</p>
            <p className={styles.noticePlace}><MapPin size={13} aria-hidden="true" /> Freguesia · Concelho</p>
            <div className={styles.noticeLine} />
            <p className={styles.noticeMessage}>A sua memória permanece entre nós.</p>
          </article>
          <p className={styles.streetLabel}>Rua da Saudade · n.º ∞</p>
        </div>
      </section>

      <section className={styles.introStrip} aria-label="Princípios do serviço">
        <p><ShieldCheck size={18} aria-hidden="true" /> Publicação por agências verificadas</p>
        <p><MapPin size={18} aria-hidden="true" /> Ligação à freguesia</p>
        <p><Heart size={18} aria-hidden="true" /> Respeito por cada família</p>
      </section>

      <section className={styles.section} id="como-funciona">
        <div className={styles.sectionHeading}>
          <p className={styles.sectionNumber}>01 · Alcance</p>
          <h2>Começa perto.<br />Chega onde for preciso.</h2>
          <p>
            A publicação local é gratuita. A família ou a agência poderá ampliar
            a divulgação conforme a localização das pessoas que deseja alcançar.
          </p>
        </div>

        <div className={styles.reachMap}>
          {reachLevels.map((level, index) => (
            <div className={`${styles.reachLevel} ${level.free ? styles.reachFree : ""}`} key={level.name}>
              <span className={styles.reachIndex}>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <h3>{level.name}</h3>
                <p>{level.note}</p>
              </div>
              {level.free && <span className={styles.freeTag}>Grátis</span>}
            </div>
          ))}
        </div>
      </section>

      <section className={`${styles.section} ${styles.ceremoniesSection}`}>
        <div className={styles.sectionHeading}>
          <p className={styles.sectionNumber}>02 · Cerimónias</p>
          <h2>Informar também<br />é cuidar.</h2>
          <p>
            Três momentos essenciais podem ser comunicados à comunidade sem custo.
          </p>
        </div>

        <div className={styles.ceremonyCards}>
          <article className={styles.ceremonyCard}>
            <span className={styles.cardIcon}><Building2 size={22} aria-hidden="true" /></span>
            <p className={styles.cardOverline}>Publicação local</p>
            <h3>Anúncio fúnebre</h3>
            <p>Informação clara sobre velório, cerimónia e despedida na freguesia.</p>
            <span className={styles.cardFree}>Gratuito na freguesia</span>
          </article>
          <article className={styles.ceremonyCard}>
            <span className={styles.cardIcon}><CalendarDays size={22} aria-hidden="true" /></span>
            <p className={styles.cardOverline}>Celebração</p>
            <h3>Missa do 7.º dia</h3>
            <p>Data, hora e local reunidos numa publicação simples de partilhar.</p>
            <span className={styles.cardFree}>Publicação gratuita</span>
          </article>
          <article className={styles.ceremonyCard}>
            <span className={styles.cardIcon}><Sparkles size={22} aria-hidden="true" /></span>
            <p className={styles.cardOverline}>Recordação</p>
            <h3>Missa do 30.º dia</h3>
            <p>Um novo encontro para recordar e agradecer a presença da comunidade.</p>
            <span className={styles.cardFree}>Publicação gratuita</span>
          </article>
        </div>
      </section>

      <section className={styles.condolencesSection}>
        <div className={styles.bookVisual} aria-hidden="true">
          <div className={styles.bookPageLeft}>
            <BookHeart size={27} />
            <span>Livro de</span>
            <strong>Condolências</strong>
          </div>
          <div className={styles.bookSpine} />
          <div className={styles.bookPageRight}>
            <span className={styles.writtenLine} />
            <span className={styles.writtenLine} />
            <span className={styles.writtenLineShort} />
            <span className={styles.signature}>Com carinho</span>
          </div>
        </div>

        <div className={styles.condolencesCopy}>
          <p className={styles.sectionNumber}>03 · Presença</p>
          <h2>Um livro que não se fecha.</h2>
          <p>
            Cada anúncio terá o seu próprio livro digital de condolências. Pessoas
            registadas poderão deixar uma mensagem respeitosa à família.
          </p>
          <ul>
            <li><MessageCircleHeart size={19} aria-hidden="true" /><span><strong>Mensagens com registo</strong> para preservar a confiança e o respeito.</span></li>
            <li><Camera size={19} aria-hidden="true" /><span><strong>Fotografias</strong> previstas para uma fase posterior.</span></li>
            <li><Heart size={19} aria-hidden="true" /><span><strong>Homenagens da família</strong> previstas para desenvolvimento futuro.</span></li>
          </ul>
        </div>
      </section>

      <section className={styles.agencySection} id="agencias">
        <div>
          <p className={styles.sectionNumber}>04 · Agências funerárias</p>
          <h2>Uma só publicação.<br />A comunidade informada.</h2>
        </div>
        <div className={styles.agencyCopy}>
          <p>
            As agências funerárias terão uma área própria para criar e gerir anúncios,
            indicar cerimónias e escolher o alcance geográfico de cada publicação.
          </p>
          <span className={styles.developmentTag}>Área em desenvolvimento</span>
        </div>
      </section>

      <footer className={styles.footer}>
        <div>
          <span className={styles.footerBrand}>Rua da Saudade</span>
          <span>Um espaço de O Tio do Joca</span>
        </div>
        <p><Globe2 size={15} aria-hidden="true" /> Da freguesia para o mundo</p>
      </footer>
    </main>
  );
}
