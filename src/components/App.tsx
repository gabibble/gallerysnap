'use client';

// The whole app: one page that moves through Photo -> Straighten -> Save.
// With several photos it shows the "gallery wall" instead.
import { useCallback, useEffect, useRef, useState } from 'react';
import { warmUp } from '@/lib/cvClient';
import { downloadAll, downloadOne } from '@/lib/download';
import type { Quad } from '@/lib/geometry';
import { GooglePhotosError, googlePhotosAvailable, loadGoogleScript, saveToGooglePhotos, signIn } from '@/lib/googlePhotos';
import { activeCorners, disposePainting, findCorners, loadPainting, makeFullResult, makeResultPreview } from '@/lib/pipeline';
import type { Mode, Painting } from '@/lib/types';
import { SavedStep, WallStep } from './BatchSteps';
import PhotoStep from './PhotoStep';
import SaveStep, { type SaveStatus } from './SaveStep';
import { AdjustView, FindingView, FoundView } from './StraightenStep';
import { Header, type StepName } from './ui';

type View = 'photo' | 'finding' | 'found' | 'adjust' | 'save' | 'wall' | 'saved';

const NOT_SET_UP = 'Saving to Google Photos is not switched on for this site yet. You can use Download for now.';

function friendly(err: unknown): string {
  if (err instanceof GooglePhotosError) return err.message;
  return 'Something went wrong. Please try again.';
}

export default function App() {
  const [view, setView] = useState<View>('photo');
  const [mode, setMode] = useState<Mode>('auto');
  const [paintings, setPaintings] = useState<Painting[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({ kind: 'idle' });
  const [albumUrl, setAlbumUrl] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  // Latest paintings, for async work that outlives a render.
  const paintingsRef = useRef<Painting[]>([]);
  // Bumped on "start over", so slow work from an old session is ignored.
  const session = useRef(0);
  // Full-resolution results, kept until the corners change.
  const fullCache = useRef(new Map<string, { key: string; blob: Blob }>());

  useEffect(() => {
    paintingsRef.current = paintings;
  }, [paintings]);

  useEffect(() => {
    warmUp();
    if (googlePhotosAvailable) loadGoogleScript().catch(() => {});
  }, []);

  const isBatch = paintings.length > 1;
  const current = paintings.find((p) => p.id === currentId) ?? null;

  const patch = useCallback((id: string, changes: Partial<Painting>) => {
    setPaintings((list) =>
      list.map((p) => {
        if (p.id !== id) return p;
        if (changes.resultUrl !== undefined && p.resultUrl && p.resultUrl !== changes.resultUrl) URL.revokeObjectURL(p.resultUrl);
        return { ...p, ...changes };
      }),
    );
  }, []);

  function startOver() {
    session.current++;
    paintingsRef.current.forEach(disposePainting);
    fullCache.current.clear();
    setPaintings([]);
    setCurrentId(null);
    setView('photo');
    setBusy(false);
    setOpening(false);
    setNotice(null);
    setPhotoError(null);
    setSaveStatus({ kind: 'idle' });
    setSavedIds([]);
  }

  async function addFiles(files: File[]) {
    const mySession = ++session.current;
    setOpening(true);
    setPhotoError(null);
    const loaded: Painting[] = [];
    let failed = 0;
    for (const file of files) {
      try {
        loaded.push(await loadPainting(file));
      } catch {
        failed++;
      }
    }
    if (mySession !== session.current) {
      loaded.forEach(disposePainting);
      return;
    }
    setOpening(false);
    if (loaded.length === 0) {
      setPhotoError('Sorry, that photo could not be opened. Please try a JPG, PNG or HEIC photo.');
      return;
    }
    if (failed > 0) setPhotoError(null);
    setPaintings(loaded);
    paintingsRef.current = loaded;
    setSaveStatus({ kind: 'idle' });

    if (loaded.length === 1) {
      const p = loaded[0];
      setCurrentId(p.id);
      if (mode === 'manual') {
        patch(p.id, { status: 'needs' });
        setNotice(null);
        setView('adjust');
        return;
      }
      setView('finding');
      const found = await findCorners(p);
      if (mySession !== session.current) return;
      patch(p.id, found);
      if (found.detection?.painting) {
        setView('found');
      } else {
        setNotice("I couldn't find the edges in this photo. Please drag the circles onto the corners.");
        setView('adjust');
      }
      return;
    }

    // Several photos: show the wall straight away and work through them.
    setCurrentId(null);
    setView('wall');
    for (const p of loaded) {
      if (mode === 'manual') {
        patch(p.id, { status: 'needs' });
        continue;
      }
      const found = await findCorners(p);
      if (mySession !== session.current) return;
      if (found.status === 'good') {
        try {
          const preview = await makeResultPreview({ ...p, ...found });
          if (mySession !== session.current) return;
          patch(p.id, { ...found, ...preview });
        } catch {
          patch(p.id, { ...found, status: 'needs' });
        }
      } else {
        patch(p.id, found);
      }
    }
  }

  /** Corners are settled: straighten, then go to Save (or back to the wall). */
  async function finish(id: string, changes: Partial<Painting>) {
    const p = paintingsRef.current.find((x) => x.id === id);
    if (!p) return;
    const mySession = session.current;
    setBusy(true);
    try {
      const next = { ...p, ...changes };
      const preview = await makeResultPreview(next);
      if (mySession !== session.current) return;
      patch(id, { ...changes, ...preview, status: 'good' });
      setSaveStatus({ kind: 'idle' });
      setNotice(null);
      setView(paintingsRef.current.length > 1 ? 'wall' : 'save');
    } catch {
      if (mySession !== session.current) return;
      setNotice('Sorry, that did not work. Please move the circles a little and try again.');
      setView('adjust');
    } finally {
      if (mySession === session.current) setBusy(false);
    }
  }

  async function fullResult(p: Painting): Promise<Blob> {
    const key = JSON.stringify([activeCorners(p), p.dimensions]);
    const hit = fullCache.current.get(p.id);
    if (hit && hit.key === key) return hit.blob;
    const blob = await makeFullResult(p);
    fullCache.current.set(p.id, { key, blob });
    return blob;
  }

  /** The paintings a save or download applies to. */
  function ready(): Painting[] {
    const list = paintingsRef.current;
    return list.length > 1 ? list.filter((p) => p.status === 'good') : list;
  }

  async function download() {
    const list = ready();
    if (!list.length) return;
    setSaveStatus({ kind: 'working', what: 'download' });
    try {
      if (list.length === 1 && paintingsRef.current.length === 1) {
        downloadOne(await fullResult(list[0]), list[0].name);
      } else {
        const files = [];
        for (const p of list) files.push({ blob: await fullResult(p), originalName: p.name });
        await downloadAll(files);
      }
      setSaveStatus({ kind: 'downloaded' });
    } catch {
      setSaveStatus({ kind: 'error', message: 'Sorry, the download did not work. Please try again.' });
    }
  }

  async function saveToGoogle() {
    const list = ready();
    if (!list.length) return;
    if (!googlePhotosAvailable) {
      setSaveStatus({ kind: 'error', message: NOT_SET_UP });
      return;
    }
    setSaveStatus({ kind: 'working', what: 'google' });
    try {
      // Sign in first, while the click is fresh, or the pop-up gets blocked.
      await signIn();
      const files = [];
      for (const p of list) files.push({ blob: await fullResult(p), originalName: p.name });
      const result = await saveToGooglePhotos(files);
      setAlbumUrl(result.albumUrl);
      if (paintingsRef.current.length > 1) {
        setSavedIds(list.map((p) => p.id));
        setSaveStatus({ kind: 'idle' });
        setView('saved');
      } else {
        setSaveStatus({ kind: 'saved', url: result.photos[0]?.url ?? result.albumUrl });
      }
    } catch (err) {
      setSaveStatus({ kind: 'error', message: friendly(err) });
    }
  }

  const step: StepName = view === 'photo' ? 'photo' : view === 'save' || view === 'saved' ? 'save' : 'straighten';
  const backFromStraighten = isBatch ? () => setView('wall') : startOver;
  const backLabel = isBatch ? 'Back to all paintings' : 'Back to photo';

  return (
    <div className="min-h-dvh flex flex-col">
      <Header step={step} count={paintings.length} onHome={startOver} />

      {view === 'photo' && <PhotoStep mode={mode} onModeChange={setMode} onFiles={addFiles} busy={opening} error={photoError} />}

      {view === 'finding' && current && <FindingView src={current.previewUrl} name={current.name} />}

      {view === 'found' && current && (
        <FoundView
          src={current.previewUrl}
          name={current.name}
          corners={activeCorners(current)}
          unsure={current.status === 'needs'}
          hasFrame={!!current.detection?.frame}
          includeFrame={current.includeFrame}
          onIncludeFrame={(v) => patch(current.id, { includeFrame: v })}
          onAccept={() => finish(current.id, {})}
          onAdjust={() => {
            // From here on the user owns the corners, starting from what's shown.
            patch(current.id, { corners: activeCorners(current), includeFrame: false });
            setNotice(null);
            setView('adjust');
          }}
          onBack={backFromStraighten}
          backLabel={backLabel}
          busy={busy}
        />
      )}

      {view === 'adjust' && current && (
        <AdjustView
          src={current.previewUrl}
          name={current.name}
          corners={current.corners}
          onChange={(corners: Quad) => patch(current.id, { corners })}
          onDone={(corners: Quad) => finish(current.id, { corners, includeFrame: false })}
          onBack={backFromStraighten}
          backLabel={backLabel}
          notice={notice}
          busy={busy}
        />
      )}

      {view === 'save' && current && (
        <SaveStep
          painting={current}
          status={saveStatus}
          onGoogle={saveToGoogle}
          onDownload={download}
          onDimensions={(text) => finish(current.id, { dimensions: text })}
          onBack={() => {
            setSaveStatus({ kind: 'idle' });
            setView(current.detection?.painting && mode === 'auto' ? 'found' : 'adjust');
          }}
          onAnother={startOver}
        />
      )}

      {view === 'wall' && (
        <WallStep
          paintings={paintings}
          status={saveStatus}
          onFix={(id) => {
            const p = paintings.find((x) => x.id === id);
            if (!p) return;
            setCurrentId(id);
            setNotice(null);
            setSaveStatus({ kind: 'idle' });
            // Straight to the numbered circles, starting from the outline shown
            // on the wall (with the frame, if it was included).
            patch(id, { corners: activeCorners(p), includeFrame: false });
            setView('adjust');
          }}
          onGoogle={saveToGoogle}
          onDownload={download}
          onStartOver={startOver}
        />
      )}

      {view === 'saved' && <SavedStep paintings={paintings.filter((p) => savedIds.includes(p.id))} albumUrl={albumUrl} onNew={startOver} />}
    </div>
  );
}
