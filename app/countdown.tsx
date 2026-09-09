"use client";

import { useEffect, useState } from "react";
import styles from "./countdown.module.css";

const TARGET_DATE = new Date("2026-12-15T00:00:00Z").getTime();

type RemainingTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  tenths: number;
  hundredths: number;
  finished: boolean;
};

function getRemainingTime(): RemainingTime {
  const difference = Math.max(0, TARGET_DATE - Date.now());

  return {
    days: Math.floor(difference / 86_400_000),
    hours: Math.floor((difference / 3_600_000) % 24),
    minutes: Math.floor((difference / 60_000) % 60),
    seconds: Math.floor((difference / 1_000) % 60),
    tenths: Math.floor((difference % 1_000) / 100),
    hundredths: Math.floor((difference % 100) / 10),
    finished: difference === 0,
  };
}

function format(value: number, digits = 2) {
  return value.toString().padStart(digits, "0");
}

export function Countdown() {
  const [time, setTime] = useState<RemainingTime | null>(null);

  useEffect(() => {
    let frame: number;

    const update = () => {
      const remaining = getRemainingTime();
      setTime(remaining);

      if (!remaining.finished) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const values = time ?? {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    tenths: 0,
    hundredths: 0,
    finished: false,
  };

  const units = [
    { label: "Dias", value: format(values.days, 3), wide: true },
    { label: "Horas", value: format(values.hours) },
    { label: "Minutos", value: format(values.minutes) },
    { label: "Segundos", value: format(values.seconds) },
    { label: "Décimos", value: values.tenths.toString(), fraction: true },
    { label: "Centésimos", value: values.hundredths.toString(), fraction: true },
  ];

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />

      <section className={styles.content} aria-labelledby="countdown-title">
        <div className={styles.brand}>
          <span className={styles.brandMark}>TJ</span>
          <span>O Tio do Joca</span>
        </div>

        <div className={styles.intro}>
          <p className={styles.eyebrow}>Estamos a preparar algo especial</p>
          <h1 id="countdown-title">
            A nossa terra<br />
            <span>está quase a chegar.</span>
          </h1>
          <p className={styles.date}>15 · 12 · 2026</p>
        </div>

        {values.finished ? (
          <p className={styles.finished} role="status">
            Chegou o grande dia.
          </p>
        ) : (
          <div className={styles.timer} role="timer" aria-live="off" aria-label="Tempo restante até 15 de dezembro de 2026">
            {units.map((unit, index) => (
              <div className={styles.timerItem} key={unit.label}>
                {index > 0 && <span className={styles.separator} aria-hidden="true">:</span>}
                <div>
                  <span
                    className={`${styles.value} ${unit.wide ? styles.wide : ""} ${unit.fraction ? styles.fraction : ""}`}
                    suppressHydrationWarning
                  >
                    {unit.value}
                  </span>
                  <span className={styles.label}>{unit.label}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className={styles.note}>Guarda a data. Encontramo-nos aqui.</p>
      </section>

      <footer className={styles.footer}>
        <span>Portugal</span>
        <span className={styles.footerLine} aria-hidden="true" />
        <span>2026</span>
      </footer>
    </main>
  );
}
