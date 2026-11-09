"use client";

import { Clock, PenLine, ShieldAlert, Trash2, TriangleAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ComingSoon, Skeleton } from "@/components/ui/ComingSoon";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PhotoHeader } from "@/components/ui/Photo";
import { useUndoToast } from "@/components/ui/UndoToast";
import { nowIso, saveWithOutbox, type PostRow } from "@/lib/db";
import { relativeFr } from "@/lib/format";
import { useOnline, usePosts, useProfile } from "@/lib/hooks";
import { t } from "@/lib/i18n";
import { loadPosts } from "@/lib/remote";
import { getZone } from "@/lib/zones";

const X = t.exchanges;
const MAX = 1000;

/** Fenêtre d'écriture ; le message passe par la file d'envoi, en ligne comme hors ligne. */
function Composer({ open, onClose, onSend }: { open: boolean; onClose: () => void; onSend: (body: string) => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [body, setBody] = useState("");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const trimmed = body.trim();

  return (
    <dialog ref={ref} className="modal modal-bottom sm:modal-middle" onCancel={onClose}>
      <div className="modal-box flex flex-col gap-3">
        <label className="flex flex-col gap-2">
          <span className="text-lg font-bold">{X.bodyLabel}</span>
          <textarea
            maxLength={MAX}
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="textarea w-full text-lg"
          />
        </label>
        <p className="text-right text-sm">{X.counter(body.length)}</p>
        <p className="text-sm">{X.privacy}</p>
        <Button
          block
          size="lg"
          disabled={!trimmed}
          onClick={() => {
            onSend(trimmed);
            setBody("");
          }}
        >
          {X.send}
        </Button>
        <Button block variant="ghost" onClick={onClose}>
          {t.common.cancel}
        </Button>
      </div>
    </dialog>
  );
}

function PostCard({ post, zoneName, onDelete }: { post: PostRow; zoneName: string; onDelete: (p: PostRow) => void }) {
  const author = post.is_mine ? (post.author_name ?? X.me) : (post.author_name ?? X.producerOf(zoneName));
  return (
    <li className="cv-auto rounded-box border border-base-300 bg-base-100 p-4">
      <p className="flex flex-wrap items-baseline justify-between gap-x-3">
        <span className="font-bold">{author}</span>
        <span className="text-sm opacity-80">{relativeFr(post.updated_at)}</span>
      </p>
      <p className="mt-1 wrap-break-word whitespace-pre-line">{post.body}</p>
      {post.sync_state === "pending" ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold">
          <Clock aria-hidden="true" size={16} />
          {X.pendingPost}
        </p>
      ) : null}
      {post.sync_state === "rejected" ? (
        <p className="mt-2 flex items-center gap-1.5 text-sm font-bold text-error">
          <TriangleAlert aria-hidden="true" size={16} />
          {X.rejectedPost}
        </p>
      ) : null}
      {post.is_mine ? (
        <button type="button" onClick={() => onDelete(post)} className="btn btn-ghost mt-1 -ml-3 min-h-12 h-auto gap-2 rounded-full text-error">
          <Trash2 aria-hidden="true" size={20} />
          {X.delete}
        </button>
      ) : null}
    </li>
  );
}

/** Échanges entre producteurs : la liste locale s'affiche d'abord, l'API la complète. */
export default function ExchangesPage() {
  const profile = useProfile();
  const posts = usePosts(profile?.zone_id);
  const online = useOnline();
  const zone = getZone(profile?.zone_id);
  const [writing, setWriting] = useState(false);
  const [toDelete, setToDelete] = useState<PostRow | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useUndoToast();

  useEffect(() => {
    if (!zone || !online) return;
    let cancelled = false;
    loadPosts(zone.zone_id)
      .then((next) => {
        if (!cancelled) setCursor(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [zone, online]);

  if (profile === undefined || posts === undefined) return <Skeleton lines={4} />;

  if (!profile || !zone) {
    return (
      <ComingSoon icon={<ShieldAlert aria-hidden="true" size={64} />} title={t.home.notSetUp}>
        <Button href="/demarrer">{t.landing.start}</Button>
      </ComingSoon>
    );
  }

  async function send(body: string) {
    setWriting(false);
    await saveWithOutbox("posts", {
      id: crypto.randomUUID(),
      zone_id: zone!.zone_id,
      body,
      ...(profile!.display_name ? { author_name: profile!.display_name } : {}),
      updated_at: nowIso(),
      deleted: false,
      is_mine: true,
      sync_state: "pending",
    });
  }

  async function remove(post: PostRow) {
    setToDelete(null);
    await saveWithOutbox("posts", { ...post, deleted: true, updated_at: nowIso(), sync_state: "pending" });
    toast.show(X.deleted);
  }

  async function more() {
    if (!cursor) return;
    setLoading(true);
    try {
      setCursor(await loadPosts(zone!.zone_id, cursor));
    } catch {
      toast.show(t.states.errorText);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 pb-16">
      <PhotoHeader image="community" title={X.title} subtitle={zone.name_fr} />
      <p className="flex items-start gap-2 rounded-box bg-base-200 p-3">
        <ShieldAlert aria-hidden="true" size={22} className="mt-0.5 shrink-0 text-warning" />
        {X.privacy}
      </p>

      {posts.length === 0 ? <p className="py-6 text-center text-lg">{X.empty}</p> : null}
      <ul className="flex flex-col gap-3">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} zoneName={zone.name_fr} onDelete={setToDelete} />
        ))}
      </ul>
      {cursor ? (
        <Button variant="outline" block disabled={loading} onClick={() => void more()}>
          {X.loadMore}
        </Button>
      ) : null}

      <div className="fixed inset-x-0 bottom-20 z-10 mx-auto flex max-w-xl justify-end px-4 pb-[env(safe-area-inset-bottom)] pointer-events-none">
        <Button size="lg" className="pointer-events-auto shadow-lg" icon={<PenLine size={24} />} onClick={() => setWriting(true)}>
          {X.write}
        </Button>
      </div>

      <Composer open={writing} onClose={() => setWriting(false)} onSend={(b) => void send(b)} />
      <ConfirmDialog
        open={toDelete !== null}
        message={X.deleteConfirm}
        confirmLabel={X.delete}
        onCancel={() => setToDelete(null)}
        onConfirm={() => toDelete && void remove(toDelete)}
      />
      {toast.element}
    </div>
  );
}
