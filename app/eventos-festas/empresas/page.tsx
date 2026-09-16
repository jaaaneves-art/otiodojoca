import { Directory } from '@/components/eventos-festas/directory';
import type { SearchParams } from '@/lib/eventos-festas/types';
export const metadata = { title: 'Profissionais' };
export default async function Page({ searchParams }: { searchParams: Promise<SearchParams> }) { return <Directory params={await searchParams} />; }
