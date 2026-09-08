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
import { exitedStudents } from '@/lib/exited-students';
const num = (v: number) => new Intl.NumberFormat('kk-KZ').format(v);
const pct = (v: number | null) =>
  v === null
    ? '—'
    : new Intl.NumberFormat('kk-KZ', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(v) + '%';
const initials = (s: string) =>
  s
    .split(' ')
    .slice(0, 2)
    .map((x) => x[0])
    .join('');
const streamName = (id: string) =>
  streams.find((s) => s.id === id)?.label || id;
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
export default function Home() {
  const [view, setView] = useState('overview'),
    [stream, setStream] = useState('all'),
    [query, setQuery] = useState(''),
    [exitQuery, setExitQuery] = useState(''),
    [exitReason, setExitReason] = useState('all'),
    [groups, setGroups] = useState<Group[]>(baseline),
    [entries, setEntries] = useState<Entry[]>([]),
    [user, setUser] = useState<{ id: string; name: string } | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [modal, setModal] = useState<'case' | 'practice' | 'metric' | null>(null),
    [groupId, setGroupId] = useState(baseline[0].id),
    [status, setStatus] = useState('contact'),
    [busy, setBusy] = useState(false),
    [formError, setFormError] = useState(''),
    [detail, setDetail] = useState<Entry | null>(null),
    [caseFilter, setCaseFilter] = useState('all');
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const b = await api('/api/dashboard');
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
  const selected = useMemo(
    () => groups.filter((g) => stream === 'all' || g.stream === stream),
    [groups, stream],
  );
  const activeStreams = useMemo(
    () => streams.filter((s) => groups.some((g) => g.stream === s.id)),
    [groups],
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
  const practices = filteredEntries.filter((e) => e.kind === 'practice');
  const allExited = useMemo(
    () => [
      ...exitedStudents,
      ...practices.map((e) => ({
        id: e.id,
        name: e.title,
        reason: e.reason || 'Көрсетілмеген',
        curator: groups.find((g) => g.id === e.groupId)?.name || 'Көрсетілмеген',
        subject: streamName(groups.find((g) => g.id === e.groupId)?.stream || ''),
        date: e.created.slice(0, 10),
      })),
    ],
    [groups, practices],
  );
  const exitReasons = useMemo(
    () => [...new Set(allExited.map((student) => student.reason))].sort(),
    [allExited],
  );
  const visibleExited = allExited.filter(
    (student) =>
      (exitReason === 'all' || student.reason === exitReason) &&
      `${student.name} ${student.curator} ${student.subject}`
        .toLocaleLowerCase()
        .includes(exitQuery.toLocaleLowerCase()),
  );
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
    kind: 'case' | 'practice' | 'metric',
    id = selected[0]?.id || baseline[0].id,
  ) => {
    setGroupId(id);
    setStatus('contact');
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
                    'experience',
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
                  'cases',
                  'experience',
                  'ranking',
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
        <span className="semester">SMART · 11 СЫНЫП · 2027</span>
      </header>
      <section className="page">
        <div className="eyebrow">МАТЕМАТИКАЛЫҚ САУАТТЫЛЫҚ</div>
        <div className="heading">
          <div>
            <h1>Әр оқушы маңызды.</h1>
            <p>Ағымдар нәтижесі және кураторлар жұмысы</p>
          </div>
          <button className="action" onClick={() => open('case')}>
            <Plus size={18} /> Жұмыс қосу
          </button>
        </div>
        <div className="navigation">
          <Tabs value={view} onValueChange={(v) => setView(String(v))}>
            <TabsList className="main-tabs">
              {[
                ['overview', 'Жалпы шолу'],
                ['curators', 'Кураторлар'],
                ['cases', 'Оқушымен жұмыс'],
                ['experience', 'Шыққан оқушылар'],
                ['ranking', 'Рейтинг'],
              ].map(([v, l]) => (
                <TabsTrigger key={v} value={v}>
                  {l}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        <div className="filterbar">
          <Picker
            value={stream}
            onChange={setStream}
            options={[
              { value: 'all', label: 'Барлық ағымдар' },
              ...activeStreams.map((s) => ({ value: s.id, label: s.label })),
            ]}
            label="Ағымды таңдау"
          />
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
              <article className="stat">
                <span>
                  <Users size={19} /> Жалпы оқушылар
                </span>
                <strong>{num(summary.total)}</strong>
                <small>{selected.length} топ бойынша</small>
              </article>
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
                  <TableRow key={g.id}>
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
                        onClick={() => open('metric', g.id)}
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
        {view === 'cases' && (
          <>
            <div className="section-title">
              <div>
                <h2>Оқушымен жұмыс</h2>
                <p>Себебі → байланыс → шешім → нәтиже</p>
              </div>
              <button className="action" onClick={() => open('case')}>
                <Plus size={17} /> Жазба қосу
              </button>
            </div>
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
        {view === 'experience' && (
          <>
            <div className="section-title">
              <div>
                <h2>Шыққан оқушылар</h2>
                <p>Шығу себептері бойынша тіркелген оқушылар</p>
              </div>
              <button className="action" onClick={() => open('practice')}>
                <Plus size={17} /> Оқушы қосу
              </button>
            </div>
            <div className="exit-filters">
              <Picker value={exitReason} onChange={setExitReason} options={[{value:'all',label:'Барлық себеп'},...exitReasons.map((reason)=>({value:reason,label:reason}))]} label="Шығу себебі" />
              <label className="search"><Search size={17}/><input value={exitQuery} onChange={(e)=>setExitQuery(e.target.value)} placeholder="Оқушыны немесе кураторды іздеу" /></label>
              <span>{num(visibleExited.length)} оқушы</span>
            </div>
            <div className="exit-reasons">
              {exitReasons.slice(0, 12).map((reason) => <button key={reason} className={exitReason===reason?'selected':''} onClick={()=>setExitReason(exitReason===reason?'all':reason)}><span>{reason}</span><b>{allExited.filter((student)=>student.reason===reason).length}</b></button>)}
            </div>
            <section className="panel">
              <Table><TableHeader><TableRow><TableHead>Күні</TableHead><TableHead>Оқушы</TableHead><TableHead>Шығу себебі</TableHead><TableHead>Куратор</TableHead><TableHead>Пән</TableHead></TableRow></TableHeader><TableBody>{visibleExited.map((student)=><TableRow key={student.id}><TableCell>{student.date||'—'}</TableCell><TableCell><div className="person"><span className="avatar">{initials(student.name)}</span>{student.name}</div></TableCell><TableCell><span className="status status-left">{student.reason}</span></TableCell><TableCell>{student.curator}</TableCell><TableCell>{student.subject}</TableCell></TableRow>)}</TableBody></Table>
              {!visibleExited.length&&<div className="compact-empty">Бұл сүзгі бойынша оқушы табылмады.</div>}
            </section>
          </>
        )}
        <footer>
          <span>МС Retention · 2026–2027</span>
          <span>
            JUZ40 көшірмесі: 08.09.2026 · Автоматты синхрондау қосылмаған
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
                  : 'Оқушымен жұмысты тіркеу'}
            </DialogTitle>
            <DialogDescription>
              {modal === 'metric'
                ? 'JUZ40 деректеріне сүйеніп, ұзарту есебін жаңартыңыз.'
                : modal === 'practice'
                  ? 'Оқушының аты-жөнін, шығу себебін және жүргізілген байланысты жазыңыз.'
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
