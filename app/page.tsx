import type { Metadata } from "next";
import { Countdown } from "./countdown";

export const metadata: Metadata = {
  title: "Brevemente | O Tio do Joca",
  description: "O Tio do Joca chega a 15 de dezembro de 2026.",
};

export default function HomePage() {
  return <Countdown />;
}
