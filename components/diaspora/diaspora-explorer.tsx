"use client";

import { useMemo, useState } from "react";
import { Building2, MapPin, Search, Store, Users } from "lucide-react";
import styles from "@/app/diaspora/page.module.css";

export type DiasporaEntry = {
  id: string;
  name: string;
  kind: "associacao" | "empresa" | "empresario";
  city: string;
  country: string;
  parish: string;
  municipality: string;
  description: string;
  verified?: boolean;
};

const kindLabel = { associacao: "Associação", empresa: "Empresa", empresario: "Empresário" };
const kindIcon = { associacao: Users, empresa: Store, empresario: Building2 };

export function DiasporaExplorer({ entries }: { entries: DiasporaEntry[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("todos");
  const results = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-PT");
    return entries.filter((entry) => {
      const matchesKind = kind === "todos" || entry.kind === kind;
      const haystack = [entry.name, entry.city, entry.country, entry.parish, entry.municipality, entry.description]
        .join(" ").toLocaleLowerCase("pt-PT");
      return matchesKind && (!normalized || haystack.includes(normalized));
    });
  }, [entries, kind, query]);

  return (
    <section className={styles.directory} id="diretorio" aria-labelledby="directory-title">
      <div className={styles.sectionHeading}>
        <p>Diretório da comunidade</p>
        <h2 id="directory-title">Encontrar portugueses no mundo</h2>
      </div>
      <div className={styles.filters}>
        <label className={styles.search}>
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Pesquisar</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="País, cidade, freguesia, associação…" />
        </label>
        <label>
          <span className="sr-only">Tipo de perfil</span>
          <select value={kind} onChange={(event) => setKind(event.target.value)}>
            <option value="todos">Todos</option>
            <option value="associacao">Associações</option>
            <option value="empresa">Empresas</option>
            <option value="empresario">Empresários</option>
          </select>
        </label>
      </div>
      <p className={styles.resultCount} aria-live="polite">{results.length} {results.length === 1 ? "resultado" : "resultados"}</p>
      <div className={styles.cards}>
        {results.map((entry) => {
          const Icon = kindIcon[entry.kind];
          return (
            <article className={styles.card} key={entry.id}>
              <div className={styles.cardTop}><span className={styles.cardIcon}><Icon size={21} /></span><span>{kindLabel[entry.kind]}</span>{entry.verified && <strong>Verificado</strong>}</div>
              <h3>{entry.name}</h3>
              <p className={styles.location}><MapPin size={15} /> {entry.city}, {entry.country}</p>
              <p>{entry.description}</p>
              <div className={styles.origin}><span>Ligação a Portugal</span><b>{entry.parish}</b><small>{entry.municipality}</small></div>
            </article>
          );
        })}
        {!results.length && <p className={styles.empty}>Não foram encontrados perfis. Experimente outra pesquisa.</p>}
      </div>
    </section>
  );
}
