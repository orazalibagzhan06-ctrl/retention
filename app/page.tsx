import Dashboard from './dashboard';
import {requireCurator} from '@/lib/curator-auth';
export const dynamic='force-dynamic';
export default async function Page(){await requireCurator();return <Dashboard/>}
