'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Suspense, useState } from 'react';
import { CalendarClock, ChevronLeft, MessageCircle, Phone, Plus } from 'lucide-react';
import { JobStepper, TaskList } from '@/components/features/JobProgress';
import { NoAccess } from '@/components/features/NoAccess';
import { TopBar } from '@/components/layout/AppShell';
import { Avatar, Button, Card, EmptyState, FilterTabs, Input, Modal, Select, StatusBadge, Textarea, VehicleImage, useToast } from '@/components/ui';
import { addNote, addTask, requestPart, setJobStage } from '@/lib/actions';
import { getJobFor } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { customerOf, km, STAGE_LABEL, userOf, vehicleName, vehicleOf } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Stage } from '@/lib/types';

type Tab = 'overview' | 'tasks' | 'inspection' | 'parts' | 'notes';
const MOVE: Stage[] = ['inspection', 'diagnostics', 'in_repair', 'quality_check', 'ready'];
const PARTS = ['Brake Pad (Front)', 'Brake Disc (Front)', 'Engine Oil SW30', 'Air Filter', 'Spark Plug', 'AC Filter', 'Cabin Filter', 'Oil Filter'];

function Inner() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const { user } = useSession();
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>('overview');
  const [note, setNote] = useState('');
  const [task, setTask] = useState('');
  const [partOpen, setPartOpen] = useState(false);
  const [part, setPart] = useState(PARTS[0]);
  const [qty, setQty] = useState('1');
  const job = user ? getJobFor(db, user, id) : undefined;
  if (!user || !job) return <NoAccess what="job" backHref="/employee/jobs" />;

  const v = vehicleOf(db, job.vehicleId);
  const cust = customerOf(db, job.customerId);
  const tech = userOf(db, job.techId);
  const photos = [...new Set([...job.photos, ...job.points.flatMap((p) => p.photos)])];
  const requests = db.partRequests.filter((r) => r.jobId === job.id);

  const phone = (cust?.phone ?? '').replace(/\s/g, '');
  const open = (t: Tab) => (t === 'inspection' ? router.push(`/employee/jobs/${job.id}/inspection`) : setTab(t));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Link href="/employee/jobs" className="btn btn-neu h-11 gap-2 px-4 text-sm"><ChevronLeft className="h-4 w-4" /> Back to Jobs</Link>
        <div className="ml-auto flex items-center gap-2">
          <label className="sr-only" htmlFor="stage">Job status</label>
          <Select id="stage" value={job.stage} onChange={(e) => { setJobStage(job.id, e.target.value as Stage, user.name); toast.show(`Status: ${STAGE_LABEL[e.target.value as Stage]}`); }} className="w-[190px] [&_select]:!bg-ok-soft [&_select]:font-semibold [&_select]:text-ok-strong">
            {MOVE.concat(job.stage === 'pending' ? ['pending'] : []).map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <div>
          <h1 className="text-[26px] font-bold leading-tight">#{job.id} - {vehicleName(v)}</h1>
          <p className="mb-4 text-sm tracking-wide text-ink-500">{v?.reg}</p>
          <Card className="p-5">
            {v && <VehicleImage carKey={v.carKey} className="mx-auto h-[230px] w-full max-w-[440px]" alt={vehicleName(v)} />}
            <div className="mt-3 flex gap-3">
              {(photos.length ? photos.slice(0, 3) : []).map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p} src={p} alt="" className="h-[58px] w-[84px] rounded-xl object-cover shadow-neu-xs" />
              ))}
              {photos.length > 3 && <span className="neu-in-sm flex h-[58px] w-[84px] items-center justify-center text-sm font-semibold text-ink-500">+{photos.length - 3}</span>}
            </div>
          </Card>
        </div>
        <div className="space-y-4 xl:pt-[62px]">
          <Card className="flex items-center gap-4 p-4">
            <Avatar src={cust?.avatar} size={48} />
            <div className="min-w-0 flex-1"><p className="font-semibold">{cust?.name}</p><p className="text-sm text-ink-500">{cust?.phone}</p></div>
            <a href={`tel:${phone}`} aria-label="Call customer" className="btn btn-soft h-10 w-10 !rounded-xl"><Phone className="h-4 w-4" /></a>
            <a href={`https://wa.me/${phone.replace('+', '')}`} target="_blank" rel="noreferrer" aria-label="Message customer on WhatsApp" className="btn btn-soft h-10 w-10 !rounded-xl"><MessageCircle className="h-4 w-4" /></a>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-bold">Vehicle Details</h2>
            <div className="flex items-center gap-4">
              {v && <VehicleImage carKey={v.carKey} className="h-11 w-20" />}
              <div className="text-sm"><p className="font-semibold">{vehicleName(v)}</p><p className="text-ink-500">{v?.year} · {v?.variant} · {v && km(v.odometer)}</p></div>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-xs text-ink-400">Service Type</dt><dd className="font-semibold">{job.service}</dd></div>
              <div className="flex items-center gap-3"><Avatar src={tech?.avatar} size={34} /><div><dt className="text-xs text-ink-400">Assigned To</dt><dd className="font-semibold">{tech?.name}</dd></div></div>
              <div className="flex items-center gap-3"><span className="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-bad-soft text-bad"><CalendarClock className="h-4 w-4" /></span><div><dt className="text-xs text-ink-400">Due Date</dt><dd className="font-semibold">{job.dueLabel}</dd></div></div>
            </dl>
          </Card>
        </div>
      </div>

      <FilterTabs variant="underline" className="mb-4 mt-5" value={tab} onChange={open} tabs={[{ value: 'overview', label: 'Overview' }, { value: 'tasks', label: 'Tasks' }, { value: 'inspection', label: 'Inspection' }, { value: 'parts', label: 'Parts' }, { value: 'notes', label: 'Notes' }]} />

      {tab === 'overview' && (
        <div className="space-y-5">
          <Card className="p-5"><h2 className="mb-4 font-bold">Job Progress</h2><JobStepper job={job} /></Card>
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Card className="p-5"><h2 className="mb-3 font-bold">Service Details</h2><TaskList jobId={job.id} tasks={job.tasks} canEdit /></Card>
            <Card className="p-5">
              <h2 className="mb-3 font-bold">Quick Actions</h2>
              <div className="space-y-3">
                <Button size="lg" className="w-full" href={`/employee/jobs/${job.id}/checklist`}>Update Progress</Button>
                <Button size="lg" variant="neu" className="w-full" onClick={() => setTab('notes')}>Add Note</Button>
                <Button size="lg" variant="neu" className="w-full" onClick={() => setPartOpen(true)}>Request Parts</Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <Card className="p-5">
          <TaskList jobId={job.id} tasks={job.tasks} canEdit />
          <form className="mt-5 flex gap-3" onSubmit={(e) => { e.preventDefault(); addTask(job.id, task); setTask(''); }}>
            <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Add a task…" aria-label="New task" />
            <Button type="submit" disabled={!task.trim()}><Plus className="h-4 w-4" /> Add</Button>
          </form>
        </Card>
      )}

      {tab === 'parts' && (
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-bold">Parts requests</h2><Button size="sm" onClick={() => setPartOpen(true)}><Plus className="h-4 w-4" /> Request part</Button></div>
          {requests.length === 0 ? <EmptyState title="No parts requested" /> : (
            <ul className="space-y-2.5">{requests.map((r) => <li key={r.id} className="neu-row flex items-center gap-3 px-4 py-3"><span className="flex-1 text-sm font-medium">{r.partName} <span className="text-ink-400">× {r.qty}</span></span><StatusBadge tone={r.status === 'Approved' ? 'green' : r.status === 'Rejected' ? 'red' : 'amber'}>{r.status}</StatusBadge></li>)}</ul>
          )}
        </Card>
      )}

      {tab === 'notes' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <h2 className="mb-3 font-bold">Add note</h2>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a note for the team…" aria-label="Note" />
            <Button className="mt-3" disabled={!note.trim()} onClick={() => { addNote(job.id, user.name, note); setNote(''); toast.show('Note added'); }}>Save note</Button>
          </Card>
          <Card className="p-5">
            <h2 className="mb-3 font-bold">Activity</h2>
            <ol className="space-y-3 border-l-2 border-ivory-300 pl-4">{job.activity.map((a) => <li key={a.id}><p className="text-sm">{a.text}</p><p className="text-xs text-ink-400">{a.by} · {a.at}</p></li>)}</ol>
          </Card>
        </div>
      )}

      <Modal open={partOpen} onClose={() => setPartOpen(false)} title="Request part" size="sm" footer={<><Button variant="neu" onClick={() => setPartOpen(false)}>Cancel</Button><Button onClick={() => { const n = Math.max(1, parseInt(qty, 10) || 1); requestPart({ partName: part, jobId: job.id, qty: n, by: user.id }); setPartOpen(false); toast.show('Parts request sent for approval'); }}>Send request</Button></>}>
        <div className="space-y-4">
          <label className="block text-xs font-medium text-ink-500">Part<Select value={part} onChange={(e) => setPart(e.target.value)} className="mt-1.5">{PARTS.map((p) => <option key={p}>{p}</option>)}</Select></label>
          <label className="block text-xs font-medium text-ink-500">Quantity<Input inputMode="numeric" value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1.5" /></label>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}

export default function EmployeeJobPage() {
  return (
    <Suspense>
      <TopBar />
      <Inner />
    </Suspense>
  );
}
