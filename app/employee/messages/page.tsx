'use client';

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';
import { Megaphone, Paperclip, Plus, Search, Share2, SlidersHorizontal } from 'lucide-react';
import { TopBar } from '@/components/layout/AppShell';
import { Avatar, EmptyState, FilterTabs, useToast } from '@/components/ui';
import { markChannelRead, reactToMessage, sendMessage } from '@/lib/actions';
import { useSession } from '@/lib/auth';
import { userOf } from '@/lib/format';
import { LogoMark } from '@/components/layout/AppShell';
import { useDb } from '@/lib/store';

export default function MessagesPage() {
  const db = useDb();
  const { user } = useSession();
  const toast = useToast();
  const [tab, setTab] = useState<'chat' | 'ann'>('chat');
  const [active, setActive] = useState('ch-general');
  const [q, setQ] = useState('');
  const [text, setText] = useState('');
  const end = useRef<HTMLDivElement>(null);
  const channel = db.channels.find((c) => c.id === active);
  const msgs = db.messages.filter((m) => m.channelId === active);
  useEffect(() => end.current?.scrollIntoView({ block: 'end' }), [msgs.length, active]);
  if (!user) return null;
  const list = db.channels.filter((c) => !q || c.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <TopBar />
      <div className="mb-4 flex items-center justify-between gap-3">
        <FilterTabs variant="soft" value={tab} onChange={setTab} tabs={[{ value: 'chat', label: 'Team Chat' }, { value: 'ann', label: 'Announcements' }]} />
        <div className="flex gap-2.5">
          <button aria-label="Share chat link" className="btn btn-neu h-11 w-11 !rounded-xl" onClick={() => { navigator.clipboard?.writeText(window.location.href); toast.show('Link copied'); }}><Share2 className="h-[18px] w-[18px]" /></button>
          <button aria-label="Chat settings" className="btn btn-neu h-11 w-11 !rounded-xl"><SlidersHorizontal className="h-[18px] w-[18px]" /></button>
        </div>
      </div>

      {tab === 'ann' ? (
        <ul className="space-y-3">
          {db.announcements.map((a) => (
            <li key={a.id} className="neu-row flex items-start gap-4 px-5 py-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-coral-100 text-coral-500"><Megaphone className="h-5 w-5" /></span>
              <div><p className="font-semibold">{a.title}</p><p className="text-sm text-ink-600">{a.body}</p><p className="mt-1 text-xs text-ink-400">{a.by} · {a.at}</p></div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <div className="space-y-3">
            <label className="neu-in flex h-12 items-center gap-3 !rounded-2xl px-4 text-ink-400"><Search className="h-4 w-4" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search team members..." aria-label="Search team members" className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-300" /></label>
            <ul className="space-y-1.5">
              {list.map((c) => {
                const u = c.withUser ? userOf(db, c.withUser) : undefined;
                return (
                  <li key={c.id}>
                    <button onClick={() => { setActive(c.id); markChannelRead(c.id); }} aria-current={active === c.id} className={clsx('flex w-full items-center gap-3 rounded-2xl p-3 text-left transition', active === c.id ? 'neu-sm' : 'hover:bg-white/50')}>
                      {c.kind === 'group' ? <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-b from-[#fff3ea] to-[#ffe0cc] shadow-neu-xs"><LogoMark className="h-7 w-7" /></span> : <Avatar src={u?.avatar} size={44} />}
                      <span className="min-w-0 flex-1"><span className="flex items-baseline justify-between gap-2"><span className="truncate text-sm font-bold">{c.name}</span><span className="shrink-0 text-[10px] text-ink-400">{c.lastAt}</span></span><span className="block truncate text-xs text-ink-500">{c.last}</span></span>
                      {c.unread > 0 && <span className="flex h-5 min-w-5 items-center justify-center rounded-md bg-coral-500 px-1 text-[11px] font-bold text-white">{c.unread}</span>}
                    </button>
                  </li>
                );
              })}
              {list.length === 0 && <li className="py-6 text-center text-sm text-ink-400">No conversations found.</li>}
            </ul>
          </div>
          <div className="neu flex min-h-[520px] flex-col">
            {channel ? (
              <>
                <div className="border-b border-ivory-300/60 px-5 py-4"><h2 className="font-bold">{channel.kind === 'group' ? `${channel.name} - Workshop` : channel.name}</h2><p className="text-xs text-ink-500">{channel.kind === 'group' ? `${channel.members} members` : 'Direct message'}</p></div>
                <div className="thin-scroll flex-1 space-y-4 overflow-y-auto px-5 py-4" role="log" aria-live="polite">
                  {msgs.map((m) => {
                    const u = userOf(db, m.from);
                    return (
                      <div key={m.id} className="flex items-start gap-3">
                        <Avatar src={u?.avatar} size={38} />
                        <div className="min-w-0 max-w-[560px]">
                          <p className="text-sm"><b>{u?.name}</b> <span className="ml-1 text-xs text-ink-400">{m.at}</span></p>
                          <p className="text-[15px] text-ink-700">{m.text}</p>
                          {m.image && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={m.image} alt="Shared photo" className="mt-2 w-full max-w-[340px] rounded-2xl object-cover shadow-neu-sm" />
                          )}
                          {m.reactions?.map((r) => <button key={r.emoji} onClick={() => reactToMessage(m.id, r.emoji)} className="mt-2 mr-2 rounded-xl bg-warn-soft px-3 py-1 text-sm font-semibold text-warn-strong">{r.emoji} {r.count}</button>)}
                        </div>
                      </div>
                    );
                  })}
                  {msgs.length === 0 && <EmptyState title="No messages yet" text="Say hello to start the conversation." />}
                  <div ref={end} />
                </div>
                <form className="flex items-center gap-3 border-t border-ivory-300/60 p-4" onSubmit={(e) => { e.preventDefault(); sendMessage(active, user.id, text); setText(''); }}>
                  <button type="button" aria-label="Attach file" className="btn btn-neu h-11 w-11 !rounded-full" onClick={() => toast.show('Attachments are not available in this demo')}><Paperclip className="h-[18px] w-[18px]" /></button>
                  <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a message..." aria-label="Message" className="neu-in-sm h-11 flex-1 px-4 text-sm outline-none" />
                  <button type="submit" aria-label="Send message" disabled={!text.trim()} className="btn btn-coral h-11 w-11 !rounded-xl"><Plus className="h-5 w-5" /></button>
                </form>
              </>
            ) : <EmptyState title="Select a conversation" />}
          </div>
        </div>
      )}
      {toast.node}
    </>
  );
}
