'use client';

import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { CalendarClock, ChevronLeft, Link2, Phone, Plus, Wrench } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { JobStepper, TaskList } from '@/components/features/JobProgress';
import { NoAccess } from '@/components/features/NoAccess';
import { Avatar, Button, Card, EmptyState, FilterTabs, Input, Modal, ProgressBar, Select, StatusBadge, Textarea, VehicleImage, useToast } from '@/components/ui';
import { addJobPhoto, addNote, addTask, decidePartRequest, reassignJob, sendMessage, setJobNotes, setJobStage } from '@/lib/actions';
import { getJobFor } from '@/lib/access';
import { useSession } from '@/lib/auth';
import { customerOf, estimateOfJob, inr, km, STAGE_LABEL, userOf, vehicleName, vehicleOf, estimateTotals } from '@/lib/format';
import { useDb } from '@/lib/store';
import type { Stage } from '@/lib/types';

type Tab = 'overview' | 'inspection' | 'tasks' | 'parts' | 'photos' | 'messages' | 'history';
const STAGES: Stage[] = ['pending', 'inspection', 'diagnostics', 'in_repair', 'quality_check', 'ready', 'delivered'];
const SAMPLE = ['disc-orange', 'disc-dark', 'garage-1', 'estimate-disc', 'bumper', 'pads-chat'].map((n) => `/assets/photos/${n}.jpg`);

function Inner() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const router = useRouter();
  const db = useDb();
  const { user } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'overview');
  const [statusOpen, setStatusOpen] = useState(false);
  const [newStage, setNewStage] = useState<Stage | ''>('');
  const [note, setNote] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [msg, setMsg] = useState('');

  const job = user ? getJobFor(db, user, id) : undefined;
  if (!job || !user) return <NoAccess what="job" backHref="/admin/jobs" />;
  const v = vehicleOf(db, job.vehicleId);
  const cust = customerOf(db, job.customerId);
  const tech = userOf(db, job.techId);
  const est = estimateOfJob(db, job.id);
  const requests = db.partRequests.filter((r) => r.jobId === job.id);
  const thread = db.messages.filter((m) => m.channelId === `job-${job.id}`);
  const allPhotos = [...new Set([...job.photos, ...job.points.flatMap((p) => p.photos)])];

  const open = (t: Tab) => {
    if (t === 'inspection') return router.push(`/admin/jobs/${job.id}/inspection`);
    setTab(t);
  };

  return (
    <>
      <TopBar showUser />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Link href="/admin/jobs" aria-label="Back to jobs" className="btn btn-neu h-11 w-11 !rounded-full">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-[24px] font-bold tracking-tight">#{job.id} - {vehicleName(v)}</h1>
        <StatusBadge tone={job.stage === 'delivered' || job.stage === 'ready' ? 'green' : 'green'} dot size="lg">{job.stage === 'in_repair' ? 'In Progress' : STAGE_LABEL[job.stage]}</StatusBadge>
        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="neu"
            size="sm"
            onClick={() => {
              navigator.clipboard?.writeText(`${window.location.origin}/track/${job.trackingToken}`);
              toast.show('Secure tracking link copied');
            }}
          >
            <Link2 className="h-4 w-4" /> Copy tracking link
          </Button>
          <Avatar src={tech?.avatar} name={tech?.name} size={38} />
        </div>
      </div>
      <div className="mb-5 flex items-center gap-4 text-xs text-ink-400">
        <span className="w-10 text-right">{job.progress}%</span>
        <ProgressBar value={job.progress} className="flex-1" />
        <span className="w-10">100%</span>
      </div>

      <FilterTabs
        variant="underline"
        className="mb-5"
        value={tab}
        onChange={open}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'inspection', label: 'Inspection' },
          { value: 'tasks', label: 'Tasks' },
          { value: 'parts', label: 'Parts' },
          { value: 'photos', label: 'Photos' },
          { value: 'messages', label: 'Messages' },
          { value: 'history', label: 'History' },
        ]}
      />

      {tab === 'overview' && (
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
            <Card className="p-5">
              {v && <VehicleImage carKey={v.carKey} className="mx-auto h-[220px] w-full max-w-[420px]" alt={vehicleName(v)} />}
              <p className="mt-3 text-lg font-bold">{vehicleName(v)}</p>
              <p className="mt-0.5 text-sm text-ink-500">
                {v?.reg} <span className="mx-2 text-ink-300">|</span> {v?.year} · {v?.variant} <span className="mx-2 text-ink-300">|</span> {v && km(v.odometer)}
              </p>
            </Card>
            <Card className="divide-y divide-ivory-300/70 p-2">
              <div className="flex items-center gap-4 px-4 py-4">
                <Avatar src={cust?.avatar} name={cust?.name} size={44} />
                <div className="flex-1">
                  <p className="font-semibold">{cust?.name}</p>
                  <p className="text-sm text-ink-500">{cust?.phone}</p>
                </div>
                <a href={`tel:${cust?.phone.replace(/\s/g, '')}`} aria-label="Call customer" className="btn btn-neu h-10 w-10 !rounded-full"><Phone className="h-4 w-4" /></a>
              </div>
              <div className="flex items-center gap-4 px-4 py-4">
                <span className="neu-sm flex h-11 w-11 items-center justify-center !rounded-full text-ink-700"><CalendarClock className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs text-ink-400">Promised Delivery</p>
                  <p className="text-sm font-semibold">{job.promised}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-4">
                <span className="neu-sm flex h-11 w-11 items-center justify-center !rounded-full text-ink-700"><Wrench className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs text-ink-400">Service Type</p>
                  <p className="text-sm font-semibold">{job.service}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 px-4 py-4">
                <Avatar src={tech?.avatar} size={44} />
                <div className="flex-1">
                  <p className="text-xs text-ink-400">Assigned to</p>
                  <p className="text-sm font-semibold">{tech?.name}</p>
                </div>
                <Select aria-label="Reassign technician" className="w-40" value={job.techId} onChange={(e) => { reassignJob(job.id, e.target.value); toast.show('Technician reassigned'); }}>
                  {db.users.filter((u) => u.role === 'technician' && u.title === 'Technician').map((u) => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </Select>
              </div>
            </Card>
          </div>
          <Card className="px-4 py-6 sm:px-8">
            <JobStepper job={job} />
          </Card>
          <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
            <Card className="p-5">
              <h2 className="mb-4 text-lg font-bold">Current Tasks ({job.tasks.length})</h2>
              <TaskList jobId={job.id} tasks={job.tasks} canEdit />
            </Card>
            <Card className="flex flex-col p-5">
              <Textarea value={job.notes} onChange={(e) => setJobNotes(job.id, e.target.value)} placeholder="Add note..." className="!min-h-[170px] flex-1" aria-label="Job note" />
              <Button className="mt-4 !h-14 text-base" onClick={() => { setNewStage(job.stage); setStatusOpen(true); }}>
                Update Status
              </Button>
            </Card>
          </div>
        </div>
      )}

      {tab === 'tasks' && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">Tasks ({job.tasks.length})</h2>
          <TaskList jobId={job.id} tasks={job.tasks} canEdit />
          <form className="mt-5 flex gap-3" onSubmit={(e) => { e.preventDefault(); addTask(job.id, taskTitle); setTaskTitle(''); }}>
            <Input value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Add a task…" aria-label="New task" />
            <Button type="submit" disabled={!taskTitle.trim()}><Plus className="h-4 w-4" /> Add</Button>
          </form>
        </Card>
      )}

      {tab === 'parts' && (
        <div className="space-y-5">
          <Card className="p-5">
            <h2 className="mb-3 text-lg font-bold">Parts requests</h2>
            {requests.length === 0 ? <EmptyState title="No parts requested" text="Technicians can request parts from the job." /> : (
              <ul className="space-y-2.5">
                {requests.map((r) => (
                  <li key={r.id} className="neu-row flex flex-wrap items-center gap-3 px-4 py-3">
                    <span className="flex-1 text-sm font-medium">{r.partName} <span className="text-ink-400">× {r.qty}</span></span>
                    <span className="text-xs text-ink-400">{userOf(db, r.requestedBy)?.name} · {r.at}</span>
                    <StatusBadge tone={r.status === 'Approved' ? 'green' : r.status === 'Rejected' ? 'red' : 'amber'}>{r.status}</StatusBadge>
                    {r.status === 'Pending' && (
                      <>
                        <Button size="sm" variant="soft" onClick={() => { decidePartRequest(r.id, 'Approved'); toast.show('Request approved and stock updated'); }}>Approve</Button>
                        <Button size="sm" variant="neu" onClick={() => decidePartRequest(r.id, 'Rejected')}>Reject</Button>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {est && (
            <Card className="p-5">
              <h2 className="mb-3 text-lg font-bold">Estimate {est.id}</h2>
              <ul className="divide-y divide-ivory-300/60 text-sm">
                {est.items.map((i) => (
                  <li key={i.id} className="flex justify-between py-2.5"><span>{i.name} <span className="text-ink-400">· {i.type}</span></span><span className="font-medium">{inr(i.amount)}</span></li>
                ))}
              </ul>
              <p className="mt-3 flex justify-between text-sm font-bold"><span>Total (incl. GST)</span><span>{inr(estimateTotals(est.items).total)}</span></p>
              <Button href={`/admin/estimates/${est.id}`} variant="neu" size="sm" className="mt-4">Open estimate</Button>
            </Card>
          )}
        </div>
      )}

      {tab === 'photos' && (
        <div>
          <div className="mb-4 flex justify-between">
            <h2 className="text-lg font-bold">Photos ({allPhotos.length})</h2>
            <Button size="sm" variant="blue" onClick={() => { addJobPhoto(job.id, SAMPLE.find((p) => !allPhotos.includes(p)) ?? SAMPLE[0]); toast.show('Photo added'); }}><Plus className="h-4 w-4" /> Add Photo</Button>
          </div>
          {allPhotos.length === 0 ? <EmptyState title="No photos yet" /> : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {allPhotos.map((p) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={p} src={p} alt="" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-neu-sm" />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'messages' && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">Job messages</h2>
          <div className="space-y-3">
            {thread.length === 0 && <EmptyState title="No messages yet" text="Start a conversation about this job." />}
            {thread.map((m) => {
              const u = userOf(db, m.from);
              return (
                <div key={m.id} className="flex items-start gap-3">
                  <Avatar src={u?.avatar} size={34} />
                  <div className="neu-row px-4 py-2.5"><p className="text-xs font-semibold">{u?.name} <span className="font-normal text-ink-400">{m.at}</span></p><p className="text-sm">{m.text}</p></div>
                </div>
              );
            })}
          </div>
          <form className="mt-4 flex gap-3" onSubmit={(e) => { e.preventDefault(); sendMessage(`job-${job.id}`, user.id, msg); setMsg(''); }}>
            <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Type a message…" aria-label="Message" />
            <Button type="submit" disabled={!msg.trim()}>Send</Button>
          </form>
        </Card>
      )}

      {tab === 'history' && (
        <Card className="p-5">
          <h2 className="mb-4 text-lg font-bold">History</h2>
          <ol className="relative space-y-4 border-l-2 border-ivory-300 pl-5">
            {job.activity.map((a) => (
              <li key={a.id} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-coral-500 ring-4 ring-white" />
                <p className="text-sm">{a.text}</p>
                <p className="text-xs text-ink-400">{a.by} · {a.at}</p>
              </li>
            ))}
          </ol>
        </Card>
      )}

      <Modal
        open={statusOpen}
        onClose={() => setStatusOpen(false)}
        title="Update status"
        size="sm"
        footer={
          <>
            <Button variant="neu" onClick={() => setStatusOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (newStage && newStage !== job.stage) setJobStage(job.id, newStage, user.name);
                if (note.trim()) addNote(job.id, user.name, note);
                setNote('');
                setStatusOpen(false);
                toast.show('Status updated');
              }}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <label className="block text-xs font-medium text-ink-500">Status
            <Select value={newStage} onChange={(e) => setNewStage(e.target.value as Stage)} className="mt-1.5">
              {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
            </Select>
          </label>
          <label className="block text-xs font-medium text-ink-500">Note (optional)
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-1.5" />
          </label>
          <p className="text-xs text-ink-400">The customer is notified when a job moves to repair, quality check or ready.</p>
        </div>
      </Modal>
      {toast.node}
    </>
  );
}

export default function AdminJobPage() {
  return (
    <Suspense>
      <Inner />
    </Suspense>
  );
}
