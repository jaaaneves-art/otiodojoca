// app/(alojamento)/layout.tsx

import Link from 'next/link';

export const metadata = {
  title: 'Alojamento | O Tio do Joca',
  description: 'Encontre alojamentos rurais, casas de turismo e hospedagem em Portugal',
};

export default function AlojamentoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/alojamento" className="flex items-center gap-2 text-2xl font-bold text-blue-600">
            <span>🏨</span>
            <span>Alojamento</span>
          </Link>
          
          <div className="flex items-center gap-6">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              Início
            </Link>
            <Link href="/alojamento" className="text-gray-600 hover:text-gray-900">
              Alojamentos
            </Link>
            <a href="#contacto" className="text-gray-600 hover:text-gray-900">
              Contacto
            </a>
          </div>
        </div>
      </nav>

      {/* Conteúdo principal */}
      <main>{children}</main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Sobre */}
            <div>
              <h3 className="text-lg font-bold mb-4">Sobre Alojamento</h3>
              <p className="text-gray-400">
                Descubra casas rurais autênticas, pousadas acolhedoras e alojamentos únicos
                para uma experiência inesquecível no coração de Portugal.
              </p>
            </div>

            {/* Links Rápidos */}
            <div>
              <h3 className="text-lg font-bold mb-4">Links Rápidos</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/alojamento" className="hover:text-white transition-colors">
                    Ver Alojamentos
                  </Link>
                </li>
                <li>
                  <Link href="/alojamento" className="hover:text-white transition-colors">
                    Filtrar por Tipo
                  </Link>
                </li>
                <li>
                  <a href="#contacto" className="hover:text-white transition-colors">
                    Contacte-nos
                  </a>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div id="contacto">
              <h3 className="text-lg font-bold mb-4">Contacto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="mailto:info@otiodojoca.pt" className="hover:text-white transition-colors">
                    📧 info@otiodojoca.pt
                  </a>
                </li>
                <li>
                  <a href="tel:+351253123456" className="hover:text-white transition-colors">
                    📞 +351 253 123 456
                  </a>
                </li>
                <li className="text-gray-400">
                  📍 Guimarães, Portugal
                </li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-800 pt-8 text-center text-gray-400">
            <p>&copy; 2026 O Tio do Joca - Alojamento Rural. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
