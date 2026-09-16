'use client';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  ArrowUpRight,
  Users,
  Layers,
  TrendingUp,
  Plus,
  Search,
  ArrowRight,
  RefreshCw,
  FileText,
  MessageCircle,
  Trophy,
  CheckCircle2,
  Clock,
  Paperclip,
  BookOpen,
  Info,
  Pencil,
  LoaderCircle,
} from 'lucide-react';
import {
  baseline,
  streams,
  summarize,
  rate,
  statuses,
  type Group,
  type Entry,
} from '@/lib/data';
import { students } from '@/lib/students';
import { riskStudents } from '@/lib/risk-students';
import type { Curator } from '@/lib/curator-auth';
const num = (v: number) => new Intl.NumberFormat('kk-KZ').format(v);
const pct = (v: number | null) =>
  v === null
    ? '—'
    : new Intl.NumberFormat('kk-KZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(v) + '%';
const paymentLabel = (state: 'paid' | 'waiting' | 'left' | 'unknown') =>
  ({
    paid: 'Төлем жасады',
    waiting: 'Төлем күтілуде',
    left: 'Шығады',
    unknown: 'Төлем ашылмаған',
  })[state];
const initials = (s: string) =>
  s
    .split(' ')
    .slice(0, 2)
    .map((x) => x[0])
    .join('');
const streamName = (id: string) =>
  streams.find((s) => s.id === id)?.label || id;
const specialists = [
  ['Гүлдана Рахметқали', 'МС супервайзері'],
  ['Оразәлі Бағжан', 'МС-11 координаторы'],
  ['Кеңшілік Айым', 'МС-21 координаторы'],
  ['Дюсегалиева Даяна', 'МС-21 координаторы'],
  ['Исламбек Абайұлы', 'МС мұғалімі'],
  ['Бағдатов Рахат', 'МС мұғалімі'],
  ['Мақатова Аружан', 'МС мұғалімі'],
  ['Магазов Жангирхан', 'МС мұғалімі'],
  ['Болат Бекжан', 'МС академ эдвайзері'],
 ] as const;
const rrPlan = [
  { section: '1. Төлемді уақытылы жасату', tasks: [
    ['«Төлем ашылды. Ұтысқа iPhone 18 Pro Max» шаблонын топтарға 100% тарату', 'Айфон ұтысы арқылы ертерек, уақытылы төлем жасату', '15.09', 'Супервайзер, координатор, МС-11/21 кураторлар'],
    ['Күнделікті оқушы жоспарына ұтыс туралы еске салу қосу', 'Жоспар соңына «Төлем жасап iPhone 18 Pro Max ұту» туралы еске салу', '15.09–22.09', 'Супервайзер, координатор, МС-11/21 кураторлар'],
    ['Ата-анаға төлем туралы хабарлау', 'Рейтинг ашылғанын және 22-сіне дейін төлем жасағандар арасында iPhone ойнатылатынын айту', '16.09', 'Супервайзер, координатор, МС-11/21 кураторлар'],
    ['Live-сабақта келесі айға қызықтыру', 'Қызық тематика және келесі айдың күрделірек ҰБТ есебі арқылы қызықтыру', '16–17.09 және 23–24.09', 'Супервайзер, академ эдвайзер, мұғалімдер'],
    ['Күміс/қола зона оқушыларымен жеке жұмыс', 'Курс туралы ойын сұрау, төлем артықшылығын жеткізу, мотивация беру. Әр қызметкер кемінде 50 оқушымен чат/звонок жасайды', 'Дедлайн 28.09 · бақылау 19, 23, 26.09', 'Барлық команда'],
    ['Smart Friday', 'Мөлдір апайдан төлем жасатуға арналған сөйлесу фишкаларын үйрену', '18.09, 20:00', 'Барлық команда'],
    ['Келесі ай тақырыптарымен прогрев', 'Ортақ топта және TikTok-та келесі айда өтетін тақырыптарды таныстыру', '21.09', 'Супервайзер, академ эдвайзер, мұғалім, куратор'],
    ['МС төмен алған оқушы оқиғасымен статус бөлісу', 'Шекті балл, МС маңыздылығы және 4 пәнді аяқтау туралы міндетті статус', '23–24.09', 'Кураторлар'],
    ['МС пәнін TikTok-та романтизациялау', 'Core видео: орта атмосферасы, мұғалім сабақтарының құндылығы', '14.09–01.10', 'Толық команда'],
    ['Ортақ топ жүргізу', 'Күнделікті пән атмосферасы, маңыздылығы және тақырыпты қайталау', '30.09', 'Толық команда'],
  ]},
  { section: '2. МС маңыздылығын арттыру', tasks: [
    ['Рахат ағаймен «Сен білмейтін МС»', 'МС маңыздылығы, лайфхактар және ойын', '12.09', 'Супервайзер, координатор, академ эдвайзер, мұғалім'],
    ['Оқушылармен TikTok жарысы', '«МС пәні өмірде не үшін қажет?» сұрағына жауап табу', '26.09', 'Супервайзер, академ эдвайзер, координатор, куратор'],
    ['TikTok стрим', 'Пән маңыздылығы, сұрақ-жауап, ҰТ талдау', 'Айына кемі 1 рет', 'Толық команда'],
    ['Апталық прогресс марапаты', 'Рейтингте прогресс жасаған оқушыны ынталандыру', 'Апта сайын сейсенбі/сәрсенбі', 'Координатор, кураторлар'],
    ['Әлеуметтік желі кейстері', 'Шекті балл жинай алмаған оқушының шынайы кейстерімен бөлісу', '1-жартыжылдық', 'Толық команда'],
  ]},
  { section: '3. Сыртқы аудиторияға жаңа контент', tasks: [
    ['Мұғалімдер арасындағы баттл', 'Аудиторияны қызықтырып, МС пәнін көрсету', '30.09', 'Академ, мұғалімдер'],
    ['Формула жинағы арқылы Telegram-ға тарту', 'Жинақтың жартысын көрсетіп, қалғанына резерв чат/Telegram сілтемесін беру', '30.09', 'Супервайзер, координатор'],
  ]},
  { section: '4. Ішкі оқушыларды МС пәніне шақыру', tasks: [
    ['География, биология', 'МС-ке шақыру кампаниясы', '21–26.09', 'Академ'],
    ['Руслит, әдебиет', 'МС-ке шақыру кампаниясы', '28.09–03.10', 'Координатор'],
    ['Құқық, ағылшын, ДЖТ, химия, физика, информатика, математика, тарих', 'Пәндер бойынша кезең-кезеңімен МС-ке шақыру', '05.10–28.11', 'Координатор / академ'],
  ]},
  { section: '5. Оқушылардың шекті баллды толық жинауы', tasks: [
    ['СТ бойынша төмен оқушылармен жұмыс', 'Апта тақырыбы бойынша төмен оқушылармен жұмыс', 'Әр жұма', 'Толық команда'],
    ['Айлық/қорытынды тестте 50%-дан төмен алмау', 'Ешбір оқушысы 50%-дан төмен алмаған кураторды марапаттау', 'Әр ай', 'Толық команда'],
    ['Қорытынды тестте 50%-дан төмен оқушыларға қосымша қолдау', 'Барлығын топқа жинап, қайталау жоспарын құрып, қосымша сабақ өткізу', 'Әр ай', 'Толық команда'],
  ]},
 ] as const;
const groupSchedule = [
  ['17.09, бейсенбі', 'Оразәлі Бағжан · координатор', 'Кеңшілік Айым · координатор'],
  ['18.09, жұма', '—', 'Болат Бекжан'],
  ['21.09, дүйсенбі', 'Нұрлы Қайрғалиева · Еркеназ Әмзебекова', 'Шұғыла Амангелді · Эльназ Ермек · Роза Жүніс · Ақбота Құдайберген'],
  ['22.09, сейсенбі', 'Лэйла Ерсайнова · Ақбота Ғазиз', 'Аида Марбек · Шырын Нұрланқызы · Ақниет Серікбай · Молдир Скакова'],
  ['23.09, сәрсенбі', 'Асем Сейтимова · Алихан Жаумитов', 'Нұртас Жантас · Меруерт Асембаева · Эльнура Ыгышова · Назерке Нұрболқызы'],
  ['24.09, бейсенбі', 'Іңкәр Жәрдемхан · Адина Мұраталы', 'Жазира Тагайбекова · Жаннұр Шакизада · Ақүрпек Тұрсынқұл · Мухамед Гулмира'],
  ['25.09, жұма', 'Тамирлан Баяхмет · Мөлдір Дәлубайқызы', 'Ерасыл Жанболат · Балнұр Мырзабек · Арайлым Әбушахман · Талғат Аружан'],
  ['28.09, дүйсенбі', 'Жібек Қуат · Бақберген Амангелді', 'Айзере Сағатқызы · Айым Нұртулеу · Әсемай Әбдіжамил · Жұмабек Раушан'],
  ['29.09, сейсенбі', 'Аяулым Серік', 'Анель Жоламан · Сабыров Абылай · Зере Мұратбай · Нұрдос Ырысбек'],
  ['30.09, сәрсенбі', 'Іңкәр Шохан', 'Ақнұр Нүсіп · Зарина Мукашева · Қырықпа Інжу'],
] as const;
const tiktokSchedule = [
  ['17.09, бейсенбі', 'Шұғыла Амангелді · Бағжан Болат · Эльназ Ермек · Роза Жүніс · Ақбота Құдайберген'],
  ['18.09, жұма', 'Аида Марбек · Шырын Нұрланқызы · Ақниет Серікбай · Молдир Скакова · Нұртас Жантас'],
  ['19.09, сенбі', 'Меруерт Асембаева · Эльнура Ыгышова · Назерке Нұрболқызы · Жазира Тагайбекова · Жаннұр Шакизада'],
  ['21.09, дүйсенбі', 'Ақүрпек Тұрсынқұл · Мухамед Гулмира · Ерасыл Жанболат · Балнұр Мырзабек · Арайлым Әбушахман'],
  ['22.09, сейсенбі', 'Талғат Аружан · Айзере Сағатқызы · Айым Нұртулеу · Әсемай Әбдіжамил · Жұмабек Раушан'],
  ['23.09, сәрсенбі', 'Анель Жоламан · Сабыров Абылай · Зере Мұратбай · Нұрдос Ырысбек · Ақнұр Нүсіп'],
  ['24.09, бейсенбі', 'Зарина Мукашева · Қырықпа Інжу · Дастан Қайыржан · Ақнұр Ұзақова · Жайнар Сейдалиев'],
  ['25.09, жұма', 'Ернар Алтынбек · Эльвира Ерлікқызы · Зерделі Тоқтарбайқызы · Дильназ Мухитова'],
  ['26.09, сенбі', 'Аяжан Саркеева · Диана Сайлаугалиева · Нұрлы Қайрғалиева · Еркеназ Әмзебекова'],
  ['28.09, дүйсенбі', 'Лэйла Ерсайнова · Ақбота Ғазиз · Асем Сейтимова · Алихан Жаумитов'],
  ['29.09, сейсенбі', 'Іңкәр Жәрдемхан · Адина Мұраталы · Тамирлан Баяхмет · Мөлдір Дәлубайқызы'],
  ['30.09, сәрсенбі', 'Жібек Қуат · Бақберген Амангелді · Аяулым Серік · Іңкәр Шохан'],
] as const;
function PlanCheck({ value, onChange, disabled }: { value?: 'done' | 'not_done'; onChange: (value: 'done' | 'not_done') => void; disabled: boolean }) { return <span className="plan-check"><button disabled={disabled} data-active={value === 'done'} onClick={() => onChange('done')}>✓ Орындалды</button><button disabled={disabled} data-active={value === 'not_done'} onClick={() => onChange('not_done')}>✕ Орындалмады</button></span>; }
function Picker({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <Select
      value={value}
      onValueChange={(v) => {
        if (v !== null) onChange(v);
      }}
      items={options}
    >
      <SelectTrigger aria-label={label} className="picker">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
async function api(url: string, init?: RequestInit) {
  const r = await fetch(url, init);
  const b = (await r.json()) as {
    error?: string;
    groups: Group[];
    entries: Entry[];
    user: { id: string; name: string };
  };
  if (!r.ok) throw new Error(b.error || 'Сұрау орындалмады.');
  return b;
}
export default function Home({ viewer }: { viewer: Curator }) {
  const [view, setView] = useState(viewer.role === 'specialist' ? 'referrals' : 'overview'),
    [stream, setStream] = useState('all'),
    [query, setQuery] = useState(''),
    [studentQuery, setStudentQuery] = useState(''),
    [studentPaymentFilter, setStudentPaymentFilter] = useState('all'),
    [groups, setGroups] = useState<Group[]>(baseline),
    [entries, setEntries] = useState<Entry[]>([]),
    [user, setUser] = useState<{ id: string; name: string } | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [modal, setModal] = useState<'case' | 'practice' | 'metric' | 'referral' | null>(null),
    [groupId, setGroupId] = useState(baseline[0].id),
    [status, setStatus] = useState('contact'),
    [busy, setBusy] = useState(false),
    [formError, setFormError] = useState(''),
    [detail, setDetail] = useState<Entry | null>(null),
    [curatorDetail, setCuratorDetail] = useState<Group | null>(null),
    [referralTarget, setReferralTarget] = useState(''),
    [referralStudentId, setReferralStudentId] = useState(''),
    [riskSpecialist, setRiskSpecialist] = useState('Гүлдана Рахметқали'),
    [caseFilter, setCaseFilter] = useState('all'),
    [planStatus, setPlanStatus] = useState<Record<string, 'done' | 'not_done'>>({});
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [b, plan] = await Promise.all([api('/api/dashboard'), fetch('/api/plan-status').then((response) => response.json())]);
      setPlanStatus(Object.fromEntries((plan.items || []).map((item: { date: string; month: string; status: 'done' | 'not_done' }) => [`${item.date}-${item.month}`, item.status])));
      setGroups(b.groups);
      setEntries(b.entries);
      setUser(b.user);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
  }, [refresh]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(''), 5000);
    return () => clearTimeout(t);
  }, [notice]);
  const isAdmin = viewer.role === 'admin';
  const isCurator = viewer.role === 'curator';
  const allowedGroups = useMemo(
    () => isAdmin ? groups : isCurator ? groups.filter((g) => g.stream.endsWith(`-${viewer.month}`)) : groups,
    [groups, isAdmin, isCurator, viewer.month],
  );
  const selected = useMemo(
    () => allowedGroups.filter((g) => stream === 'all' || g.stream === stream),
    [allowedGroups, stream],
  );
  const activeStreams = useMemo(
    () => streams.filter((s) => allowedGroups.some((g) => g.stream === s.id)),
    [allowedGroups],
  );
  const summary = summarize(selected);
  const visible = selected.filter((g) =>
    g.name.toLocaleLowerCase().includes(query.toLocaleLowerCase()),
  );
  const filteredEntries = entries.filter((e) =>
    selected.some((g) => g.id === e.groupId),
  );
  const cases = filteredEntries.filter(
    (e) =>
      e.kind === 'case' && (caseFilter === 'all' || e.status === caseFilter),
  );
  const visibleStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          selected.some((group) => group.id === student.groupId) &&
          (stream === 'all' || student.stream === stream) &&
          (studentPaymentFilter === 'all' ||
            student.paymentState === studentPaymentFilter) &&
          `${student.name} ${student.curator} ${student.streamLabel}`
            .toLocaleLowerCase()
            .includes(studentQuery.toLocaleLowerCase()),
      ),
    [selected, stream, studentQuery, studentPaymentFilter],
  );
  const curatorStudents = useMemo(
    () =>
      curatorDetail
        ? students.filter(
            (student) =>
              student.curator === curatorDetail.name &&
              student.stream === curatorDetail.stream,
          )
        : [],
    [curatorDetail],
  );
  const referralCandidates = useMemo(
    () =>
      students.filter(
        (student) =>
          student.curator === groups.find((group) => group.id === groupId)?.name &&
          student.stream === groups.find((group) => group.id === groupId)?.stream,
      ),
    [groups, groupId],
  );
  const referrals = filteredEntries.filter((entry) => entry.kind === 'referral');
  const selectedRiskStudents = useMemo(() => riskStudents.filter((student) => student.specialist === riskSpecialist), [riskSpecialist]);
  const riskCount = useCallback((name: string) => riskStudents.filter((student) => student.specialist === name).length, []);
  const ranking = useMemo(() => {
    const byName = new Map<string, Group[]>();
    selected.forEach((g) => {
      if (g.renewed !== null)
        byName.set(g.name, [...(byName.get(g.name) || []), g]);
    });
    return [...byName]
      .map(([name, gs]) => ({ name, gs, ...summarize(gs) }))
      .filter((r) => r.denominator > 0)
      .sort(
        (a, b) =>
          (b.rr ?? 0) - (a.rr ?? 0) ||
          b.renewed - a.renewed ||
          a.name.localeCompare(b.name),
      );
  }, [selected]);
  const open = (
    kind: 'case' | 'practice' | 'metric' | 'referral',
    id = selected[0]?.id || baseline[0].id,
  ) => {
    setGroupId(id);
    setStatus('contact');
    setReferralTarget('');
    setReferralStudentId('');
    setFormError('');
    setModal(kind);
  };
  const current = groups.find((g) => g.id === groupId) || groups[0];
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      const fd = new FormData(e.currentTarget);
      if (modal === 'metric') {
        const raw = String(fd.get('renewed') ?? '').trim();
        await api('/api/metrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groupId,
            total: Number(fd.get('total')),
            renewed: raw === '' ? null : Number(raw),
            source: fd.get('source'),
          }),
        });
      } else {
        fd.set('groupId', groupId);
        fd.set('status', status);
        fd.set('kind', modal!);
        await api('/api/entries', { method: 'POST', body: fd });
      }
      setModal(null);
      setNotice('Сәтті сақталды');
      await refresh();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const updateEntry = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!detail) return;
    setBusy(true);
    setFormError('');
    try {
      const fd = new FormData(e.currentTarget);
      await api('/api/entries/' + detail.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          result: fd.get('result'),
          followUp: fd.get('followUp'),
        }),
      });
      setDetail(null);
      setNotice('Жазба жаңартылды');
      await refresh();
    } catch (e) {
      setFormError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    const ctx = (
      document as Document & {
        modelContext?: {
          registerTool: (
            tool: unknown,
            options: unknown,
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!ctx) return;
    const abort = new AbortController();
    try {
      Promise.resolve(
        ctx.registerTool(
          {
            name: 'filter_retention_dashboard',
            title: 'RR ағымын таңдау',
            description:
              'Choose a stream and section in the retention dashboard. Changes visible filters only; does not save or alter records.',
            inputSchema: {
              type: 'object',
              properties: {
                stream: {
                  type: 'string',
                  enum: ['all', ...streams.map((s) => s.id)],
                },
                view: {
                  type: 'string',
                  enum: [
                    'overview',
                    'curators',
                    'cases',
                    'ranking',
                  ],
                },
              },
              required: ['stream', 'view'],
              additionalProperties: false,
            },
            annotations: { readOnlyHint: false, untrustedContentHint: false },
            execute: async (input: unknown) => {
              const b = input as { stream: string; view: string };
              if (
                !b ||
                !['all', ...streams.map((s) => s.id)].includes(b.stream) ||
                ![
                  'overview',
                  'curators',
                  'students',
                  'cases',
                  'ranking',
                  'referrals',
                ].includes(b.view)
              )
                throw new Error('Invalid stream or view');
              setStream(b.stream);
              setView(b.view);
              await new Promise<void>((r) => requestAnimationFrame(() => r()));
              return { stream: b.stream, view: b.view };
            },
          },
          { signal: abort.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => abort.abort();
  }, []);
  const logout = async () => { await fetch('/api/logout', { method: 'POST' }); window.location.assign('/login'); };
  const setPlanCheck = async (date: string, month: 'aug' | 'sep' | 'task', value: 'done' | 'not_done') => {
    const response = await fetch('/api/plan-status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date, month, status: value }) });
    if (!response.ok) { setNotice('Бұл белгіні өзгертуге рұқсат жоқ'); return; }
    setPlanStatus((current) => ({ ...current, [`${date}-${month}`]: value }));
  };
  const showDetail = (e: Entry) => {
    setDetail(e);
    setStatus(e.status);
    setFormError('');
  };
  return (
    <main className="workspace">
      <header className="topbar">
        <a href="/" className="brand" aria-label="МС Retention басты бет">
          <span className="brandmark">
            rr<span>↗</span>
          </span>
          <div>
            МС <b>RETENTION</b>
            <small>Кураторлар жұмыс кеңістігі</small>
          </div>
        </a>
        <div className="topbar-actions"><span className="semester">SMART · 11 СЫНЫП · 2027</span><button className="logout-button" onClick={() => void logout()}>Шығу</button></div>
      </header>
      <section className="page">
        <div className="eyebrow">МАТЕМАТИКАЛЫҚ САУАТТЫЛЫҚ</div>
        <div className="heading">
          <div>
            <h1>Әр оқушы маңызды.</h1>
            <p>Ағымдар нәтижесі және кураторлар жұмысы</p>
          </div>
          {viewer.role !== 'specialist' && <button className="action" onClick={() => open('case')}>
            <Plus size={18} /> Жұмыс қосу
          </button>}
        </div>
        <div className="navigation">
          <Tabs value={view} onValueChange={(v) => setView(String(v))}>
            <TabsList className="main-tabs">
              {(viewer.role === 'admin'
                ? [['overview', 'Жалпы шолу'], ['curators', 'Кураторлар'], ['students', 'Оқушылар'], ['cases', 'RR көтеру план'], ['ranking', 'Рейтинг'], ['referrals', 'Жеке сөйлесу']]
                : viewer.role === 'specialist'
                  ? [['referrals', 'Жеке сөйлесу']]
                  : [['overview', 'Төлем'], ['cases', 'RR көтеру план'], ['ranking', 'Рейтинг'], ['referrals', 'Жеке сөйлесу']]
              ).map(([v, l]) => (
                <TabsTrigger key={v} value={v}>
                  {l}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="filterbar">
          {view !== 'cases' && <Picker
              value={stream}
              onChange={setStream}
              options={[
                { value: 'all', label: 'Барлық ағымдар' },
                ...activeStreams.map((s) => ({ value: s.id, label: s.label })),
              ]}
              label="Ағымды таңдау"
            />}
          <span className="period">
            <Clock size={15} /> Шілде–қыркүйек · 2026
          </span>
          <button
            className="text-button refresh"
            disabled={loading}
            onClick={() => void refresh()}
          >
            <RefreshCw size={15} className={loading ? 'spin' : ''} />
            {loading ? 'Жүктелуде' : 'Жазбаларды жаңарту'}
          </button>
        </div>
        {error && (
          <div className="error" role="alert">
            {error} <button onClick={() => void refresh()}>Қайта көру</button>
            <span>
              {' '}
              Соңғы JUZ40 көшірмесі көрсетіліп тұр; ортақ жазбалар жүктелмеді.
            </span>
          </div>
        )}
        {notice && (
          <div className="toast" role="status">
            <CheckCircle2 size={18} />
            {notice}
          </div>
        )}
        {(view === 'overview' || view === 'curators') && (
          <>
            <div className="stats">
              <article className="stat primary-stat">
                <span>
                  <TrendingUp size={19} /> Мерзімді ұзарту · RR
                </span>
                <strong>{pct(summary.rr)}</strong>
                <small>
                  {summary.known
                    ? `${num(summary.renewed)} / ${num(summary.denominator)} оқушы · дерегі бар топтар`
                    : 'Ұзарту деректері әлі жоқ'}
                </small>
              </article>
              <button
                className="stat stat-button"
                onClick={() => setView('students')}
                aria-label="Барлық оқушылар тізімін ашу"
              >
                <span>
                  <Users size={19} /> Жалпы оқушылар
                </span>
                <strong>{num(visibleStudents.length)}</strong>
                <small>Тізімді ашу үшін басыңыз</small>
              </button>
              <article className="stat">
                <span>
                  <Layers size={19} /> Кураторлар
                </span>
                <strong>{new Set(selected.map((g) => g.name)).size}</strong>
                <small>
                  {new Set(selected.map((g) => g.stream)).size} ағымда жұмыс
                  істейді
                </small>
              </article>
              <article className="stat">
                <span>
                  <MessageCircle size={19} /> Байланысты жалғастыру
                </span>
                <strong>
                  {
                    filteredEntries.filter(
                      (e) =>
                        e.kind === 'case' &&
                        ['contact', 'promised'].includes(e.status),
                    ).length
                  }
                </strong>
                <small>Ашық жұмыс жазбалары</small>
              </article>
            </div>
          </>
        )}
        {view === 'overview' && (
          <>
            <div className="section-title">
              <h2>Ағымдар бойынша RR</h2>
              <span>Саны және пайызы</span>
            </div>
            <div className="streams-grid">
              {activeStreams
                .filter((s) => stream === 'all' || s.id === stream)
                .map((s, i) => {
                  const gs = groups.filter((g) => g.stream === s.id),
                    a = summarize(gs);
                  return (
                    <article className="stream-card" key={s.id}>
                      <div className="stream-top">
                        <span className={'stream-icon tone-' + i}>
                          <Layers size={20} />
                        </span>
                        <span className="small-label">SMART · 11 сынып</span>
                      </div>
                      <h3>{s.label}</h3>
                      <div className="stream-numbers">
                        <strong>{pct(a.rr)}</strong>
                        <span>
                          {a.known
                            ? `${num(a.renewed)} / ${num(a.denominator)}`
                            : 'Ұзарту дерегі жоқ'}
                        </span>
                      </div>
                      <Progress
                        value={a.rr ?? 0}
                        aria-label={s.label + ' RR'}
                        className={a.rr === null ? 'unknown-progress' : ''}
                      />
                      <div className="stream-footer">
                        <span>
                          {gs.length} куратор · {num(a.total)} оқушы
                        </span>
                        <button
                          aria-label={s.label + ' кураторларын қарау'}
                          onClick={() => {
                            setStream(s.id);
                            setView('curators');
                          }}
                        >
                          <ArrowRight size={18} />
                        </button>
                      </div>
                    </article>
                  );
                })}
            </div>
            <div className="information">
              <Info size={18} />
              <p>
                <b>
                  RR = мерзімін ұзартқандар / ұзарту есебіндегі оқушылар × 100.
                </b>{' '}
                {summary.missing > 0
                  ? `${summary.missing} топта ұзарту дерегі жоқ; олар RR есебіне кірмейді. `
                  : ''}
                Төлемнің көрсеткіші ретінде JUZ40-тағы «Мерзімді ұзарту» алынды.
              </p>
            </div>
            <div className="lower-grid">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Алдыңғы қатарда</h2>
                    <p>
                      {stream === 'all'
                        ? 'Барлық ағымдардың ұзарту нәтижесі'
                        : streamName(stream) + ' ұзарту нәтижесі'}
                    </p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setView('ranking')}
                  >
                    Рейтинг <ArrowRight size={16} />
                  </button>
                </div>
                {ranking.length ? (
                  ranking.slice(0, 3).map((r, i) => (
                    <div className="leader-row" key={r.name}>
                      <span className="position">{i + 1}</span>
                      <span className="avatar">{initials(r.name)}</span>
                      <div className="leader-name">
                        {r.name}
                        <small>
                          {r.gs.map((g) => streamName(g.stream)).join(', ')}
                        </small>
                      </div>
                      <strong>{pct(r.rr)}</strong>
                    </div>
                  ))
                ) : (
                  <div className="compact-empty">
                    Рейтинг үшін ұзарту дерегі қажет.
                  </div>
                )}
              </section>
              <section className="work-callout">
                <span className="callout-icon">
                  <BookOpen size={23} />
                </span>
                <h2>Нәтижелі әдісіңізбен бөлісіңіз</h2>
                <p>
                  Оқушымен қалай байланыс орнаттыңыз? Не көмектесті? Тәжірибеңіз
                  басқа кураторға пайдалы болуы мүмкін.
                </p>
                <button
                  className="action light"
                  onClick={() => open('practice')}
                >
                  <Plus size={17} /> Тәжірибе қосу
                </button>
              </section>
            </div>
          </>
        )}
        {view === 'curators' && (
          <section className="panel">
            <div className="panel-heading">
              <div>
                <h2>Кураторлар бойынша</h2>
                <p>{visible.length} топ · ағым ішіндегі нәтиже</p>
              </div>
              <label className="search">
                <Search size={17} />
                <input
                  aria-label="Кураторды іздеу"
                  placeholder="Кураторды іздеу"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Куратор</TableHead>
                  <TableHead>Ағым</TableHead>
                  <TableHead>Жалпы</TableHead>
                  <TableHead>Ұзартты</TableHead>
                  <TableHead>Ұзартпады</TableHead>
                  <TableHead>RR / төлем %</TableHead>
                  <TableHead>
                    <span className="sr-only">Әрекеттер</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((g) => (
                  <TableRow
                    key={g.id}
                    className="curator-row"
                    tabIndex={0}
                    role="button"
                    aria-label={g.name + ' оқушыларын ашу'}
                    onClick={() => setCuratorDetail(g)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        setCuratorDetail(g);
                      }
                    }}
                  >
                    <TableCell>
                      <div className="person">
                        <span className="avatar">{initials(g.name)}</span>
                        {g.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="stream-label">
                        {streamName(g.stream)}
                      </span>
                    </TableCell>
                    <TableCell>{g.total}</TableCell>
                    <TableCell>{g.renewed ?? '—'}</TableCell>
                    <TableCell>
                      {g.renewed === null ? '—' : g.total - g.renewed}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          g.renewed === null
                            ? 'muted'
                            : g.renewed / g.total >= 0.85
                              ? 'good'
                              : 'pending'
                        }
                      >
                        {g.renewed === null
                          ? 'Дерек жоқ'
                          : pct(rate(g.renewed, g.total))}
                      </span>
                    </TableCell>
                    <TableCell>
                      <button
                        className="icon-button"
                        title="Көрсеткішті жаңарту"
                        aria-label={
                          g.name +
                          ' ' +
                          streamName(g.stream) +
                          ' көрсеткішін жаңарту'
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          open('metric', g.id);
                        }}
                      >
                        <Pencil size={15} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {!visible.length && (
              <div className="compact-empty">
                Іздеу бойынша куратор табылмады.
              </div>
            )}
            <div className="table-note">
              Көрсеткішті өзгерту үшін қарындашты басыңыз. «Дерек жоқ» — 0%
              емес.
            </div>
          </section>
        )}
        {view === 'ranking' && (
          <>
            <div className="section-title">
              <div>
                <h2>Кураторлар рейтингі</h2>
                <p>
                  RR бойынша ·{' '}
                  {stream === 'all'
                    ? 'Шілде–қыркүйек 2026'
                    : streamName(stream) + ' 2026'}
                </p>
              </div>
              <Trophy className="trophy" size={32} />
            </div>
            <div className="information">
              <Info size={18} />
              <p>
                Рейтингте ұзарту дерегі бар кураторлар ғана көрсетіледі. Бір
                куратордың бірнеше тобы болса, саны қосылып есептеледі. Тең
                пайыз кезінде ұзартқан оқушы саны ескеріледі. Жұмыс жазбалары
                RR-ды автоматты өзгертпейді.
              </p>
            </div>
            <section className="panel">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Орын</TableHead>
                    <TableHead>Куратор</TableHead>
                    <TableHead>Ұзартқандар / жалпы</TableHead>
                    <TableHead>RR</TableHead>
                    <TableHead>Тәжірибе</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ranking.map((r, i) => {
                    const position =
                      ranking.findIndex(
                        (v) => v.rr === r.rr && v.renewed === r.renewed,
                      ) + 1;
                    return (
                      <TableRow key={r.name}>
                        <TableCell>
                          <span className={'rank rank-' + position}>
                            {position <= 3 ? <Trophy size={16} /> : null}
                            {position}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="person">
                            <span className="avatar">{initials(r.name)}</span>
                            <div>
                              {r.name}
                              <small className="row-subtitle">
                                {r.gs
                                  .map((g) => streamName(g.stream))
                                  .join(', ')}
                              </small>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {r.renewed} / {r.denominator}
                        </TableCell>
                        <TableCell>
                          <div className="rank-progress">
                            <b>{pct(r.rr)}</b>
                            <Progress
                              value={r.rr ?? 0}
                              aria-label={r.name + ' RR'}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          {
                            entries.filter(
                              (e) =>
                                e.kind === 'practice' &&
                                r.gs.some((g) => g.id === e.groupId),
                            ).length
                          }{' '}
                          жазба
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {!ranking.length && (
                <Empty
                  icon={<Trophy size={32} />}
                  title="Рейтинг әлі қалыптасқан жоқ"
                  text="Таңдалған ағымда ұзарту деректері пайда болғанда нәтиже есептеледі."
                />
              )}
            </section>
            <div className="reward-note">
              <Trophy size={20} />
              <div>
                <b>Ай қорытындысындағы мотивация</b>
                <p>
                  Мерч, шағын бонус немесе сыйлық — марапат түрі мен
                  жеңімпаздарды ай жабылғанда жетекші бекітеді.
                </p>
              </div>
            </div>
          </>
        )}
        {view === 'referrals' && (
          <>
            <div className="section-title">
              <div>
                <h2>Жеке сөйлесуге ұсыну</h2>
                <p>Оқушыны маманға бағыттап, байланыс сұрауын тіркеңіз</p>
              </div>
            </div>
            <div className="specialist-grid">
              {specialists.map(([name, role]) => (
                <article className="specialist-card" data-active={riskSpecialist === name} key={name}>
                  <span className="avatar">{initials(name)}</span>
                  <div className="specialist-info">
                    <h3>{name}</h3>
                    <p>{role}</p>
                    <span>Тәуекел тізімі · <b>{riskCount(name)} оқушы</b></span>
                  </div>
                  <div className="specialist-actions"><button className="risk-list-button" onClick={() => { setRiskSpecialist(name); requestAnimationFrame(() => document.getElementById('risk-student-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' })); }}>Тізімді ашу</button><button className="secondary-button" onClick={() => { open('referral'); setReferralTarget(`${name} · ${role}`); }}>Ұсыну</button></div>
                </article>
              ))}
            </div>
            <section className="panel risk-roster" id="risk-student-list">
              <div className="panel-heading"><div><span className="risk-kicker">ТӘУЕКЕЛ ОҚУШЫЛАРЫ · {riskStudents.length}</span><h2>Оқушылар тізімі</h2><p>Excel тізімінен: тамыз және қыркүйек оқушылары</p></div></div>
              <div className="risk-caption"><b>{riskSpecialist}</b><span>{selectedRiskStudents.length} оқушы · Тамыз {selectedRiskStudents.filter((student) => student.stream === 'Тамыз').length} · Қыркүйек {selectedRiskStudents.filter((student) => student.stream === 'Қыркүйек').length}</span></div>
              <div className="risk-student-scroll"><Table><TableHeader><TableRow><TableHead>Оқушы</TableHead><TableHead>Ағым</TableHead><TableHead>Куратор</TableHead></TableRow></TableHeader><TableBody>{selectedRiskStudents.map((student, index) => <TableRow key={`${student.name}-${index}`}><TableCell>{student.name}</TableCell><TableCell>{student.stream}</TableCell><TableCell>{student.curator}</TableCell></TableRow>)}</TableBody></Table></div>
            </section>
            <section className="panel referrals-panel">
              <div className="panel-heading">
                <div>
                  <h2>Жіберілген ұсыныстар</h2>
                  <p>{referrals.length} оқушы маманға бағытталған</p>
                </div>
              </div>
              {referrals.length ? (
                <Table>
                  <TableHeader><TableRow><TableHead>Оқушы</TableHead><TableHead>Куратор</TableHead><TableHead>Маман</TableHead><TableHead>Ескерту</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {referrals.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>{entry.title}</TableCell>
                        <TableCell>{groups.find((group) => group.id === entry.groupId)?.name || '—'}</TableCell>
                        <TableCell>{entry.method}</TableCell>
                        <TableCell>{entry.reason || '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="compact-empty">Әзірге жеке сөйлесуге ұсыныс жоқ.</div>
              )}
            </section>
          </>
        )}
        {view === 'cases' && (
          <>
            <div className="section-title">
              <div>
                <h2>RR көтеру план · мақсат 91%+</h2>
                <p>Дедлайндар, жауаптылар және куратордың нақты әрекеттері</p>
              </div>
              <button className="action" onClick={() => open('case')}>
                <Plus size={17} /> Жазба қосу
              </button>
            </div>
            <section className="rr-plan" aria-label="RR 91 пайыз жоспары">
              <div className="rr-goal"><span>RR МАҚСАТЫ</span><strong>91%+</strong><p>Әр қызметкер дедлайнмен танысып, өзіне тиесілі жұмысты уақытында орындауы қажет.</p></div>
              <section className="group-schedule" aria-label="Ортақ топ жүргізу кестесі">
                <div><span>ОРТАҚ ТОП ЖҮРГІЗУ</span><h3>17–30 қыркүйек кестесі</h3><p>17-сі координаторлардан басталады. Әрі қарай тамыз бен қыркүйек кураторлары нақты есімдерімен бөлінді.</p></div>
                <div className="team-schedule-grid">{groupSchedule.map(([date, august, september]) => <article className="team-schedule-day" key={date}><h4>{date}</h4><div className="team-schedule-columns"><section><span>ТАМЫЗ</span><p>{august}</p><PlanCheck value={planStatus[`${date}-aug`]} onChange={(value) => void setPlanCheck(date, 'aug', value)} disabled={viewer.role === 'specialist' || (viewer.role === 'curator' && viewer.month !== 'aug')} /></section><section><span>ҚЫРКҮЙЕК</span><p>{september}</p><PlanCheck value={planStatus[`${date}-sep`]} onChange={(value) => void setPlanCheck(date, 'sep', value)} disabled={viewer.role === 'specialist' || (viewer.role === 'curator' && viewer.month !== 'sep')} /></section></div></article>)}</div>
                <div className="team-schedule-total"><b>Тамыз: 14 куратор</b><b>Қыркүйек: 32 куратор</b></div>
              </section>
              <section className="group-schedule" aria-label="TikTok жүргізу кестесі">
                <div><span>TIKTOK ЖҮРГІЗУ</span><h3>17–30 қыркүйек кестесі</h3><p>55 куратор күндерге тең бөлінді. Жексенбі — демалыс: 20 және 27 қыркүйек кестеде жоқ.</p></div>
                <div className="schedule-table"><div className="schedule-head"><span>Күні</span><span>Жауапты кураторлар</span><span>Мәртебе</span></div>{tiktokSchedule.map(([date, curators]) => <div className="schedule-row tiktok-row" key={date}><span>{date}</span><span>{curators}</span><PlanCheck value={planStatus[`${date}-tiktok`]} onChange={(value) => void setPlanCheck(date, 'tiktok', value)} disabled={viewer.role !== 'admin'} /></div>)}<div className="schedule-total"><span>Жалпы</span><b>55 куратор</b><b>12 күн</b></div></div>
              </section>
              {rrPlan.map((block) => (
                <details key={block.section} className="rr-plan-block" open>
                  <summary>{block.section} <span>{block.tasks.length} жұмыс</span></summary>
                  <div className="rr-plan-list">
                    {block.tasks.map(([title, description, deadline, owner], index) => {
                      const taskId = `task-${block.section.slice(0, 1)}-${index}`;
                      return <article key={title} className="rr-plan-item"><div><h3>{title}</h3><p>{description}</p></div><div className="rr-plan-meta"><b>Дедлайн</b><span>{deadline}</span><b>Жауапты</b><span>{owner}</span><b>Мәртебе</b><PlanCheck value={planStatus[`${taskId}-task`]} onChange={(value) => void setPlanCheck(taskId, 'task', value)} disabled={viewer.role === 'specialist'} /></div></article>;
                    })}
                  </div>
                </details>
              ))}
            </section>
            <section className="case-guide" aria-label="Кураторға арналған кейстар">
              <div className="guide-intro">
                <span className="badge">КЕЙСТАР КІТАПХАНАСЫ</span>
                <h3>Оқушыны курста алып қалу — ниеттен басталады</h3>
                <p>Оқушы — еліміздің болашағы, білімге ұмтылған жас ұрпақ және бізге сенім артқан клиент. Әр әңгіменің мақсаты — қысым емес, нақты мәселені түсініп, бірге шешім табу.</p>
              </div>
              <div className="guide-grid">
                <details open><summary>Әр әңгімеге ортақ 4 қадам</summary><ol><li><b>Жылы кіру:</b> «Саған курс ұнап жатыр ма? Оқуың қалай болып жатыр? Бұндай шешімге келуіңе не себеп болды?»</li><li><b>Нақтылау:</b> «Қазіргі дайындықта саған не жетіспей жатыр? Не нәрсе қиын болып жүр?»</li><li><b>Эмпатия:</b> «Менің де басымда осындай жағдай болған, сондықтан сені түсініп тұрмын. Бұндай жағдай көп оқушыда кездеседі. Қаласаң, осы мәселені бірге шешіп көрейік. Мен саған осы бойынша көмектесемін.»</li><li><b>Шешім:</b> Алдымен тыңдаңыз, нақтылаңыз, содан кейін ғана сәйкес шешім ұсыныңыз.</li></ol><p>Оқушыға бірден «Неге шығасың?» деп қысыммен сұрақ қоюдың қажеті жоқ. Алдымен оның жағдайын сұрап, еркін сөйлету керек. Мақсат — алғашқы себептің артындағы нақты мәселені түсіну. Оқушы өзін курста алып қалуға тырысып жатыр деп емес, өз мәселесін түсініп, көмектескісі келіп тұрған адаммен сөйлесіп отырғанын сезінуі керек.</p></details>
                <details><summary>Үлгермей жүрген оқушы</summary><p>Оқушы сабақтарға үлгермей жүргенде не істерін білмей, қалып қойған тапсырмалардың көптігінен қашып, курстан шығамын деп ойлауы мүмкін. Бәрін өзі немесе басқа курспен жаңадан бастағысы келеді. Мұндай жағдайда жай ғана «сенің қолыңнан келеді» деу жеткіліксіз.</p><p className="script">«Дана, сені түсінемін. Алғашында сабақтарға үлгермеу болуы қалыпты, шын айтамын. Бұл курсқа жаңадан келген оқушылардың бәрінің басында болады. Тіпті менің де басымда болды. Себебі, бәрін жаңадан бастап келесің. Әрі сенің мақсатың үлкен. Қазір үлгермей, ертең курстан шығып кету, бәріне өзім үлгеріп кетемін деген сөз емес. Ол себеп сенің артыңнан қалмай жүреді. Ал курстан шығу мәселеңді шешпейді, қайта қиындатуы мүмкін, уақытыңды жоғалтып аласың. Сондықтан да, бұл үлгермеу мәселесін бірге шешейік. Бүгін қиналғаның — ертең төрт сағат тест барысында көмектеседі. Нағыз үлгермеу көктемде басталады: вальс, емтихан, тоқсандық бағалар... Сондықтан, қазір күз мезгілі басталайын деп жатқанда оқып алғаның дұрыс.»</p><p><b>Бұдан кейін:</b> досы ретінде ашық сөйлесіңіз; өз басыңыздан өткен жағдаймен түсіндіріңіз; жеке жоспар құрып, тапсырмалардың дедлайнын өзіне жазып беріңіз; мотивация беріңіз.</p></details>
                <details><summary>Тақырып түсінбеген оқушы</summary><p className="script">«Кейбір тақырыптар саған қиын болып жүргенін байқадым. Сол себепті ойланып жүрсің бе?»</p><p><b>Әрекет:</b> қай тақырыптан басталғанын анықтаңыз, қосымша сабаққа қатысуын қадағалаңыз, жеке түсіндіруді ұйымдастырыңыз.</p></details>
                <details><summary>«Онлайн ыңғайсыз, оффлайн барамын»</summary><p>Оффлайн курстарды салыстырмаймыз және жамандамаймыз. Онлайн курс уақыт пен ақша жағынан ыңғайлы: оффлайнда бір күн сабақтан қалса, тақырыптардан қалып қояды, ал онлайнда барлығы қолжетімді күйінде сақталады. Оффлайнға баруға және қайтуға уақыт кетеді; онлайнда кез келген уақытта, кез келген жерде тапсырмаларды орындауға болады.</p><p><b>Үйдегі 100% комфорт.</b> Далада қандай ауа райы болса да, сен өз бөлмеңде, ыстық шайыңды ішіп алып сабақ оқи бересің. Жолға кететін бос уақыт пен энергия тек қана білімге жұмсалады.</p><p><b>Шексіз қайталау мүмкіндігі.</b> Біздің платформада барлық видеосабақтар, практика мен лайв-эфирлер сақталып тұрады. Бірдеңені ұмытып қалдың ба? Кез келген уақытта кір де, қайтадан көріп ал. Мұғалім сабағын 10 рет артқа айналдырып, толық түсінгенше көруге болады.</p><p className="script">«Сенің ең басты ресурсың — ол сенің уақытың. Оны аялдамада автобус күтуге немесе пробкада отыруға емес, грантқа жетелейтін сабақтарды көруге жұмса.»</p></details>
                <details><summary>Қаржы мәселесі</summary><p>Оқушыға құндылығын түсіндірсек, оқушы жақсы білім алып жүрген жерінен кеткісі келмейді. Көп оқушылар ішкі сенімсіздігінің кесірінен ай сайын ата-анасына төлем ақы туралы айтқысы келмейді.</p><p className="script">«Бірақ бір нәрсені ойлап көрейікші: ҰБТ-дан жоғары балл алып, грантқа түссе, 4 жылдық оқу ақысын үнемдейді. Курсқа салынған қаражат кейін бірнеше есе қайтады. Сондықтан бұл шығын емес, болашағыңа салынған инвестиция деп қарастырған дұрыс. Қазір қайта оқып алғаны, оқушы үшін өте тиімді. Соны ашық ниетімізбен түсіндірейік.»</p></details>
                <details><summary>Junior: «11-сыныпта бастасам үлгеремін»</summary><p>«ҰБТ-ға дайындықты 11-сыныпта бастасам да үлгеремін ғой...» деген оқушыға 10-сыныптан бастаудың артықшылығын көрсетіңіз: ол қазірден ешқандай стрессіз, асықпай фундамент қалайды; миы ақпаратты жайлап, сапалы қорытып үлгереді; 11-сыныпқа келгенде өзіне 100% сенімді болып отырады; дайындық барысын қиналмай, тек өткенді қайталаумен ғана өткізеді. Мүмкіндік болса, 140/140 балл алған оқушылардың кейстерін көрсетіп, оларды топқа кіргізіп кеңес айтқызыңыз.</p></details>
                <details><summary>«Ойланамын» деген оқушы</summary><p>Бір рет қана байланыс жасап, «ойланамын» деген оқушыны ұмытып кетпеуіміз керек. Бір-ақ рет қалдыруға байланыс жасау, ештеңе жасамаумен тең. Қайта жазып, пайдалы ақпарат жіберу, кейстармен бөлісу, мерекемен құттықтау, мем/юмор сияқты касаниялар арқылы оқушымен достық араны сақтаңыз.</p><p>Қарсылықтар: <b>ҚЫМБАТ, БАҒДАРЛАМА, УАҚЫТЫМ ЖОҚ.</b> Жолдағы тастар мен шұңқырлар — возражение; менеджер қарсылықтарды жабады. Көлік тоқтап қалған жер — «ОЙЛАНАЙЫН» кезеңі; бұл — дожим, менеджер нақты шешімге итермелейді. Күтілетін нәтиже — табысты мәміле, мәре — JUZ40 офис.</p><p className="script">«Алғашқы “жоқ” — бұл бас тарту емес, “иә” деген жауапқа бір қадам жақындау.»</p></details>
                <details><summary>Себепті қалай жазамыз?</summary><p>Алғашқы жауаппен тоқтамаңыз. Оффлайн курсқа байланысты үлгермесе — <b>ОФФЛАЙН</b>; отбасында төлемге мүмкіндік болмаса — <b>ҚАРЖЫ</b>; жақыны қайтыс болып, оқуға зауқы болмаса — <b>ОТБАСЫЛЫҚ</b> деп жазыңыз. Себеп неғұрлым нақты болса, шешім де соғұрлым нақты болады.</p></details>
                <details><summary>Ниет және топта прогрев</summary><p>Оқушыны курста алып қалудағы сөздер жаттанды емес, жүректен шығуы керек. Өзіңіздің ҰБТ-ға дайындалған кездегі бала кезіңізді елестетіңіз. Олардың болашағына үлкен ықпал беретін сіз бен біз.</p><p><b>«17–29.08» аралығы:</b> топта прогрев жасаңыз. Бейненің мәтіні: «ТӨЛЕМ ЖАСАП 300К ҰТЫП АЛ!»</p></details>
              </div>
            </section>
            <div className="case-summary">
              {statuses.map((s) => (
                <button
                  key={s.value}
                  className={caseFilter === s.value ? 'selected' : ''}
                  onClick={() =>
                    setCaseFilter(caseFilter === s.value ? 'all' : s.value)
                  }
                >
                  <span>{s.label}</span>
                  <b>
                    {
                      filteredEntries.filter(
                        (e) => e.kind === 'case' && e.status === s.value,
                      ).length
                    }
                  </b>
                </button>
              ))}
            </div>
            <section className="panel">
              {cases.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Оқушы / жағдай</TableHead>
                      <TableHead>Куратор</TableHead>
                      <TableHead>Мәртебе</TableHead>
                      <TableHead>Келесі байланыс</TableHead>
                      <TableHead>Дәлел</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cases.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>
                          <button
                            className="entry-title"
                            onClick={() => showDetail(e)}
                          >
                            {e.title}
                            <ArrowUpRight size={15} />
                          </button>
                          <small className="row-subtitle">
                            {e.reason || 'Себеп көрсетілмеген'}
                          </small>
                        </TableCell>
                        <TableCell>
                          {groups.find((g) => g.id === e.groupId)?.name}
                        </TableCell>
                        <TableCell>
                          <span className={'status status-' + e.status}>
                            {statuses.find((s) => s.value === e.status)?.label}
                          </span>
                        </TableCell>
                        <TableCell>{e.followUp || 'Белгіленбеген'}</TableCell>
                        <TableCell>
                          {e.fileId ? (
                            <a
                              className="text-button"
                              href={'/api/files/' + e.fileId}
                            >
                              <Paperclip size={15} /> Файл
                            </a>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Empty
                  icon={<MessageCircle size={32} />}
                  title={
                    caseFilter === 'all'
                      ? 'Алғашқы байланысты тіркеңіз'
                      : 'Бұл мәртебеде жазба жоқ'
                  }
                  text="Оқушының кету себебін, ұсынған шешіміңізді және келесі байланыс күнін жазыңыз."
                  action={() => open('case')}
                  actionText="Жұмыс қосу"
                />
              )}
            </section>
          </>
        )}
        {view === 'students' && (
          <>
            <div className="section-title">
              <div>
                <h2>Барлық оқушылар</h2>
                <p>JUZ40-тағы МС ағымдары бойынша тізім</p>
              </div>
              <span className="student-count">{num(visibleStudents.length)} оқушы</span>
            </div>
            <div className="exit-filters">
              <Picker
                value={studentPaymentFilter}
                onChange={setStudentPaymentFilter}
                options={[
                  { value: 'all', label: 'Барлық мәртебе' },
                  { value: 'paid', label: 'Төлем жасады' },
                  { value: 'waiting', label: 'Төлем күтілуде' },
                  { value: 'left', label: 'Шығады' },
                  { value: 'unknown', label: 'Төлем ашылмаған' },
                ]}
                label="Төлем мәртебесі"
              />
              <label className="search">
                <Search size={17} />
                <input
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  placeholder="Оқушыны немесе кураторды іздеу"
                />
              </label>
            </div>
            <div className="information">
              <Info size={18} />
              <p>
                Тізім JUZ40 платформасындағы 6 МС ағымынан 15.09.2026 күні
                жаңартылды. Төлем мен шығу мәртебесі әр оқушының қасында тұр.
              </p>
            </div>
            <section className="panel student-table">
              <p className="table-scroll-hint">Кестені көру үшін төмен-жоғары, қажет болса солға-оңға жылжытыңыз.</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Оқушы</TableHead>
                    <TableHead>Куратор</TableHead>
                    <TableHead>Ағым</TableHead>
                    <TableHead>Келесі ай</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <div className="person">
                          <span className="avatar">{initials(student.name)}</span>
                          {student.name || 'Аты көрсетілмеген'}
                        </div>
                      </TableCell>
                      <TableCell>{student.curator}</TableCell>
                      <TableCell>
                        <span className="stream-label">{student.streamLabel}</span>
                      </TableCell>
                      <TableCell>
                        <span className={'payment-state payment-' + student.paymentState}>
                          {paymentLabel(student.paymentState)}
                        </span>
                        {student.paymentState === 'left' && student.reason && (
                          <small className="row-subtitle">{student.reason}</small>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {!visibleStudents.length && (
                <div className="compact-empty">Іздеу бойынша оқушы табылмады.</div>
              )}
            </section>
          </>
        )}
        <footer>
          <span>МС Retention · 2026–2027</span>
          <span>
            JUZ40 көшірмесі: 16.09.2026 · 3 998 оқушы бекітілген · Төлем мәртебесі күн сайын жаңартылады
          </span>
        </footer>
      </section>
      <Dialog
        open={modal !== null}
        onOpenChange={(v) => {
          if (!v && !busy) setModal(null);
        }}
      >
        <DialogContent className="form-dialog">
          <DialogHeader>
            <DialogTitle>
              {modal === 'metric'
                ? 'Көрсеткішті жаңарту'
                : modal === 'practice'
                  ? 'Шыққан оқушыны қосу'
                  : modal === 'referral'
                    ? 'Жеке сөйлесуге ұсыну'
                  : 'Оқушымен жұмысты тіркеу'}
            </DialogTitle>
            <DialogDescription>
              {modal === 'metric'
                ? 'JUZ40 деректеріне сүйеніп, ұзарту есебін жаңартыңыз.'
                : modal === 'practice'
                  ? 'Оқушының аты-жөнін, шығу себебін және жүргізілген байланысты жазыңыз.'
                  : modal === 'referral'
                    ? 'Оқушыны таңдаңыз, маманға жіберу себебін қысқаша жазыңыз.'
                  : 'Қолданған әдісіңізді және нәтижесін нақты жазыңыз.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submit} className="entry-form">
            <label>
              Куратор және ағым
              <Picker
                value={groupId}
                onChange={setGroupId}
                options={groups.map((g) => ({
                  value: g.id,
                  label: g.name + ' · ' + streamName(g.stream),
                }))}
                label="Куратор және ағым"
              />
            </label>
            {modal === 'metric' ? (
              <div key={groupId} className="metric-fields">
                <div className="two-fields">
                  <label>
                    Есептегі жалпы оқушы
                    <input
                      name="total"
                      type="number"
                      min="0"
                      max="10000"
                      step="1"
                      required
                      defaultValue={current.total}
                    />
                  </label>
                  <label>
                    Мерзімін ұзартқан
                    <input
                      name="renewed"
                      type="number"
                      min="0"
                      max="10000"
                      step="1"
                      defaultValue={current.renewed ?? ''}
                      placeholder="Дерек жоқ болса, бос қалдырыңыз"
                    />
                  </label>
                </div>
                <label>
                  Дереккөз / есеп күні
                  <input
                    name="source"
                    required
                    maxLength={300}
                    defaultValue={current.source}
                  />
                </label>
                <p className="form-hint">
                  Бұл қыркүйек есебін жаңартады. Ұзартқандар саны бос болса, RR
                  есептелмейді. Соңғы жаңарту: {current.updated.slice(0, 10)}.
                </p>
              </div>
            ) : modal === 'referral' ? (
              <>
                <label>
                  Куратор және ағым
                  <Picker
                    value={groupId}
                    onChange={(value) => {
                      setGroupId(value);
                      setReferralStudentId('');
                    }}
                    options={groups.map((group) => ({
                      value: group.id,
                      label: group.name + ' · ' + streamName(group.stream),
                    }))}
                    label="Куратор және ағым"
                  />
                </label>
                <label>
                  Оқушы
                  <Picker
                    value={referralStudentId}
                    onChange={setReferralStudentId}
                    options={[
                      { value: '', label: 'Оқушыны таңдаңыз' },
                      ...referralCandidates.map((student) => ({
                        value: student.id,
                        label: student.name || 'Аты көрсетілмеген',
                      })),
                    ]}
                    label="Оқушыны таңдаңыз"
                  />
                </label>
                <input
                  type="hidden"
                  name="title"
                  value={referralCandidates.find((student) => student.id === referralStudentId)?.name || ''}
                />
                <label>
                  Таңдалған маман
                  <Picker
                    value={referralTarget}
                    onChange={setReferralTarget}
                    options={[
                      { value: '', label: 'Маманды таңдаңыз' },
                      ...specialists.map(([name, role]) => ({
                        value: `${name} · ${role}`,
                        label: `${name} · ${role}`,
                      })),
                    ]}
                    label="Таңдалған маман"
                  />
                </label>
                <input type="hidden" name="method" value={referralTarget} />
                <label>
                  Неге жеке сөйлесу қажет?
                  <textarea name="reason" rows={3} maxLength={2000} placeholder="Қысқаша жағдайын жазыңыз" />
                </label>
                <input type="hidden" name="result" value="" />
                <input type="hidden" name="followUp" value="" />
                <input type="hidden" name="status" value="contact" />
              </>
            ) : (
              <>
                <label>
                  {modal === 'case'
                    ? 'Оқушының коды немесе жағдай атауы'
                    : modal === 'practice'
                      ? 'Оқушының аты-жөні'
                      : 'Әдістің атауы'}
                  <input
                    name="title"
                    required
                    maxLength={140}
                    placeholder={
                      modal === 'case'
                        ? 'Мысалы: МС-024 · уақыты жетпейді'
                        : modal === 'practice'
                          ? 'Мысалы: Айдана Сәрсен'
                          : 'Мысалы: жеке оқу жоспарын бірге жасау'
                    }
                  />
                </label>
                <label>
                  {modal === 'practice' ? 'Шығу себебі' : 'Жағдай / кету себебі'}
                  <textarea
                    name="reason"
                    maxLength={2000}
                    rows={2}
                    placeholder="Оқушыға не қиындық тудырды?"
                  />
                </label>
                <label>
                  {modal === 'practice' ? 'Жүргізілген байланыс / ескерту *' : 'Жүргізілген байланыс және қолданған әдіс *'}
                  <textarea
                    name="method"
                    required
                    maxLength={5000}
                    rows={3}
                    placeholder="Қалай сөйлестіңіз, қандай шешім ұсындыңыз?"
                  />
                </label>
                <label>
                  {modal === 'practice' ? 'Қорытынды *' : 'Нәтиже'}
                  <textarea
                    name="result"
                    required={modal === 'practice'}
                    maxLength={2000}
                    rows={2}
                    placeholder="Не өзгерді? Оқушымен қандай келісімге келдіңіз?"
                  />
                </label>
                <div className="two-fields">
                  <label>
                    Мәртебе
                    <Picker
                      value={status}
                      onChange={setStatus}
                      options={statuses}
                      label="Жұмыс мәртебесі"
                    />
                  </label>
                  <label>
                    Келесі байланыс күні
                    <input name="followUp" type="date" />
                  </label>
                </div>
                <label className="upload">
                  <Paperclip size={18} /> Дәлел тіркеу
                  <input
                    type="file"
                    name="file"
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                  />
                  <small>
                    PNG, JPG, WEBP, PDF · 10 МБ-қа дейін. Оқушының артық жеке
                    мәліметтерін жасырыңыз.
                  </small>
                </label>
              </>
            )}
            {formError && (
              <div className="error" role="alert">
                {formError}
              </div>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                Бас тарту
              </button>
              <button type="submit" className="action" disabled={busy || !user}>
                {busy ? (
                  <LoaderCircle className="spin" size={17} />
                ) : (
                  <CheckCircle2 size={17} />
                )}{' '}
                {busy ? 'Сақталуда' : 'Сақтау'}
              </button>
            </div>
            {!user && (
              <p className="form-hint">
                Ортақ жазбаларды сақтау үшін сайтқа кіріп, деректердің жүктелуін
                күтіңіз.
              </p>
            )}
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={curatorDetail !== null}
        onOpenChange={(v) => {
          if (!v) setCuratorDetail(null);
        }}
      >
        <DialogContent className="form-dialog curator-dialog">
          <DialogHeader>
            <DialogTitle>{curatorDetail?.name}</DialogTitle>
            <DialogDescription>
              {curatorDetail && streamName(curatorDetail.stream)} · оқушылар
              туралы мәлімет
            </DialogDescription>
          </DialogHeader>
          {curatorDetail && (
            <>
              <div className="curator-stats">
                <div>
                  <span>Жалпы оқушы</span>
                  <b>{num(curatorStudents.length)}</b>
                </div>
                <div>
                  <span>Ұзартты</span>
                  <b>{curatorDetail.renewed ?? 'Дерек жоқ'}</b>
                </div>
                <div>
                  <span>RR</span>
                  <b>
                    {curatorDetail.renewed === null
                      ? 'Дерек жоқ'
                      : pct(rate(curatorDetail.renewed, curatorDetail.total))}
                  </b>
                </div>
              </div>
              <div className="detail-section curator-student-list">
                <h3>Оқушылар тізімі</h3>
                {curatorStudents.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Оқушы</TableHead>
                        <TableHead>Ағым</TableHead>
                        <TableHead>Келесі ай</TableHead>
                        <TableHead><span className="sr-only">Әрекет</span></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {curatorStudents.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell>{student.name}</TableCell>
                          <TableCell>{student.streamLabel}</TableCell>
                          <TableCell>
                            <span className={'payment-state payment-' + student.paymentState}>
                              {paymentLabel(student.paymentState)}
                            </span>
                            {student.paymentState === 'left' && student.reason && (
                              <small className="row-subtitle">{student.reason}</small>
                            )}
                          </TableCell>
                          <TableCell>
                            <button
                              className="referral-button"
                              onClick={() => {
                                setGroupId(curatorDetail.id);
                                setReferralStudentId(student.id);
                                setReferralTarget('');
                                setModal('referral');
                              }}
                            >
                              Жеке сөйлесуге ұсыну
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p>Бұл куратор бойынша оқушы табылмады.</p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={detail !== null}
        onOpenChange={(v) => {
          if (!v && !busy) setDetail(null);
        }}
      >
        <DialogContent className="form-dialog">
          <DialogHeader>
            <DialogTitle>{detail?.title}</DialogTitle>
            <DialogDescription>
              {groups.find((g) => g.id === detail?.groupId)?.name} ·{' '}
              {detail?.created.slice(0, 10)}
            </DialogDescription>
          </DialogHeader>
          {detail && (
            <>
              <div className="detail-section">
                <h3>Жағдай / себеп</h3>
                <p>{detail.reason || 'Көрсетілмеген'}</p>
                <h3>Қолданған әдіс</h3>
                <p>{detail.method}</p>
                {detail.fileId && (
                  <a
                    className="attachment"
                    href={'/api/files/' + detail.fileId}
                  >
                    <FileText size={18} />
                    {detail.fileName}
                  </a>
                )}
              </div>
              {detail.userId === user?.id ? (
                <form className="entry-form" onSubmit={updateEntry}>
                  <label>
                    Мәртебе
                    <Picker
                      value={status}
                      onChange={setStatus}
                      options={statuses}
                      label="Жұмыс мәртебесі"
                    />
                  </label>
                  <label>
                    Нәтиже
                    <textarea
                      name="result"
                      rows={3}
                      defaultValue={detail.result}
                      maxLength={2000}
                    />
                  </label>
                  <label>
                    Келесі байланыс
                    <input
                      name="followUp"
                      type="date"
                      defaultValue={detail.followUp}
                    />
                  </label>
                  {formError && (
                    <p className="error" role="alert">
                      {formError}
                    </p>
                  )}
                  <button className="action" disabled={busy}>
                    {busy ? 'Сақталуда' : 'Нәтижені жаңарту'}
                  </button>
                </form>
              ) : (
                <div className="detail-section">
                  <h3>Нәтиже</h3>
                  <p>{detail.result || 'Әлі тіркелмеген'}</p>
                  <span className={'status status-' + detail.status}>
                    {statuses.find((s) => s.value === detail.status)?.label}
                  </span>
                  <p>Келесі байланыс: {detail.followUp || 'Белгіленбеген'}</p>
                </div>
              )}
              <small className="muted">Жазбаны қосқан: {detail.author}</small>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
function Empty({
  icon,
  title,
  text,
  action,
  actionText,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
  action?: () => void;
  actionText?: string;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action && (
        <button className="action" onClick={action}>
          <Plus size={17} />
          {actionText}
        </button>
      )}
    </div>
  );
}
