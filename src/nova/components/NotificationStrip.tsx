import { useEffect, useState } from 'react';

const SEEN_KEY = 'nova-notifications-seen';
import { ChevronRight, X, CheckCheck } from 'lucide-react';
import ResumePlayer from '@/nova/components/ResumePlayer';

type Note = { id: string; label: string; title: string; text: string; time: string; img: string; read: boolean };

const INITIAL: Note[] = [
  { id: 'n1', label: 'New episode from your watchlist', title: 'Maharani S3', text: 'Maharani S3 • Episode 5 is now streaming', time: 'Abhi', img: 'https://images.pexels.com/photos/24286060/pexels-photo-24286060.jpeg?auto=compress&cs=tinysrgb&h=200&w=320', read: false },
  { id: 'n2', label: 'Live soon', title: 'IND vs AUS', text: 'IND vs AUS match 7:30 PM se live', time: '2h', img: 'https://images.pexels.com/photos/29263907/pexels-photo-29263907.jpeg?auto=compress&cs=tinysrgb&h=200&w=320', read: false },
  { id: 'n3', label: 'Coming Friday', title: 'NOVA Original Trailer', text: 'Naya NOVA Original trailer dekhein', time: '1d', img: 'https://images.pexels.com/photos/25746377/pexels-photo-25746377.jpeg?auto=compress&cs=tinysrgb&h=200&w=320', read: false },
];

function NoteRow({ note, onOpen }: { note: Note; onOpen: (n: Note) => void }) {
  return (
    <button onClick={() => onOpen(note)} className="flex w-full items-center gap-3 rounded-xl bg-white/5 p-2 text-left transition hover:bg-white/10">
      <img src={note.img} alt="" className="h-14 w-24 flex-shrink-0 rounded-lg object-cover" loading="lazy" />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-xs text-white/95">
          {!note.read && <span aria-label="Unread" className="h-1.5 w-1.5 shrink-0 rounded-full bg-nova-accent" />}
          {note.label} · {note.time}
        </p>
        <p className={`mt-0.5 line-clamp-2 text-sm ${note.read ? 'font-medium text-white/95' : 'font-semibold text-white'}`}>{note.text}</p>
      </div>
      <ChevronRight className="h-4 w-4 flex-shrink-0 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
    </button>
  );
}

export default function NotificationStrip({ className = 'mt-6' }: { className?: string }) {
  const [notes, setNotes] = useState<Note[]>(INITIAL);
  const [listOpen, setListOpen] = useState(false);
  const [playing, setPlaying] = useState<string | null>(null);
  const unread = notes.length;
  const latest = notes[0];

  // Seen notifications are remembered on this device and removed from the list.
  useEffect(() => {
    try {
      const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
      setNotes(INITIAL.filter((n) => !seen.includes(n.id)));
    } catch { /* storage disabled */ }
  }, []);
  const dismiss = (ids: string[]) => {
    setNotes((prev) => prev.filter((n) => !ids.includes(n.id)));
    try {
      const seen: string[] = JSON.parse(localStorage.getItem(SEEN_KEY) || '[]');
      localStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...seen, ...ids])]));
    } catch { /* storage disabled */ }
  };

  const open = (note: Note) => {
    dismiss([note.id]);
    setListOpen(false);
    setPlaying(note.title);
  };

  if (!latest && !playing) return null;

  return (
    <section className={className} aria-label="Notifications">
      <button onClick={() => setListOpen(true)} className="mb-3 flex w-full items-center justify-between px-1 text-left">
        <span className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white">Notifications</h2>
          {unread > 0 && <span className="nova-pill-solid rounded-full px-2 py-0.5 text-[10px] font-bold text-white">{unread}</span>}
        </span>
        <ChevronRight className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
      </button>
      {latest && <NoteRow note={latest} onOpen={open} />}

      {listOpen && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center bg-nova-overlay backdrop-blur-sm sm:items-center" onClick={() => setListOpen(false)}>
          <div role="dialog" aria-label="All notifications" onClick={(e) => e.stopPropagation()} className="nova-ai-panel w-full max-w-lg rounded-t-3xl border border-nova-line bg-nova-black p-4 text-white sm:rounded-3xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Notifications</h3>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { dismiss(notes.map((n) => n.id)); setListOpen(false); }}
                  disabled={unread === 0}
                  className="nova-pill flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition hover:brightness-125 disabled:opacity-40"
                >
                  <CheckCheck className="h-4 w-4 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" /> Clear all
                </button>
                <button onClick={() => setListOpen(false)} aria-label="Close notifications" className="grid h-9 w-9 place-items-center rounded-full text-white hover:bg-white/10">
                  <X className="h-5 w-5 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]" />
                </button>
              </div>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {notes.map((n) => (
                <NoteRow key={n.id} note={n} onOpen={open} />
              ))}
            </div>
          </div>
        </div>
      )}

      {playing && <ResumePlayer title={playing} onClose={() => setPlaying(null)} />}
    </section>
  );
}
