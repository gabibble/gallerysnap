'use client';

// The whole app: one page that moves through Photo -> Straighten -> Save.
// With several photos it shows the "gallery wall" instead.
import { useCallback, useEffect, useRef, useState } from 'react';
import { warmUp } from '@/lib/cvClient';
import { downloadAll, downloadEach, downloadOne, shareFiles } from '@/lib/download';
import { saveTarget } from '@/lib/saveTarget';
import { addTurns, displayQuad, fromDisplay, type Quad } from '@/lib/geometry';
import { makeDisplayUrl } from '@/lib/images';
import { GooglePhotosError, googlePhotosAvailable, loadGoogleScript, saveToGooglePhotos, signIn } from '@/lib/googlePhotos';
import { activeCorners, askUprightTurns, disposePainting, findCorners, loadPainting, makeFullResult, makeResultPreview, resultKey } from '@/lib/pipeline';
import type { Mode, Painting } from '@/lib/types';
import { SavedStep, WallStep } from './BatchSteps';
import PhotoStep from './PhotoStep';
import SaveStep, { type SaveStatus } from './SaveStep';
import { PhoneAdjust, PhoneFinding, PhoneFound, PhoneSave } from './PhoneSteps';
import { AdjustView, FindingView, FoundView } from './StraightenStep';
import { Header, IconButton, MagnifierIcon, PhoneHeader, type StepName } from './ui';
import { usePhone } from '@/lib/usePhone';

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
  const [redrawing, setRedrawing] = useState(false);
  const [magnifier, setMagnifier] = useState(true);
  const phone = usePhone();
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
  // Paintings we've already asked the AI helper "which way up?" about.
  const askedUpright = useRef(new Set<string>());

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
    askedUpright.current.clear();
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
        checkUpright({ ...p, ...found });
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
          checkUpright({ ...p, ...found, ...preview });
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

  /** Once per painting, in the background: is it the right way up? */
  function checkUpright(p: Painting) {
    if (p.turns !== 0 || askedUpright.current.has(p.id)) return;
    askedUpright.current.add(p.id);
    const mySession = session.current;
    askUprightTurns(p).then((turns) => {
      if (turns === null || mySession !== session.current) return;
      // Only show the hint if the user hasn't turned it themselves meanwhile.
      const now = paintingsRef.current.find((x) => x.id === p.id);
      if (now && now.turns === 0) patch(p.id, { suggestedTurns: turns });
    });
  }

  /**
   * Turn a painting, or switch Enhance on or off. The Straighten screens show
   * the photo turned and enhanced; the finished picture is redrawn when one
   * is on screen (the gallery wall, or Save).
   */
  async function restyle(id: string, change: { turns?: Painting['turns']; enhance?: boolean }) {
    const p = paintingsRef.current.find((x) => x.id === id);
    if (!p || redrawing) return;
    const mySession = session.current;
    const turns = change.turns ?? p.turns;
    const enhance = change.enhance ?? p.enhance;
    if (change.turns !== undefined) askedUpright.current.add(id);
    setRedrawing(true);
    setSaveStatus({ kind: 'idle' });
    let displayUrl = p.previewUrl;
    try {
      if (turns !== 0 || enhance) {
        const q = activeCorners(p);
        const xs = q.map((c) => c.x), ys = q.map((c) => c.y);
        const area = { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
        displayUrl = await makeDisplayUrl(p.previewUrl, turns, enhance ? area : null);
      }
      const changes: Partial<Painting> = { turns, enhance, displayUrl };
      if (change.turns !== undefined) changes.suggestedTurns = null;
      if (p.resultUrl && (paintingsRef.current.length > 1 || view === 'save')) Object.assign(changes, await makeResultPreview({ ...p, ...changes }));
      if (mySession !== session.current) {
        if (displayUrl !== p.previewUrl) URL.revokeObjectURL(displayUrl);
        return;
      }
      patch(id, changes);
      if (p.displayUrl !== p.previewUrl) URL.revokeObjectURL(p.displayUrl);
    } catch {
      if (mySession === session.current) setSaveStatus({ kind: 'error', message: 'Sorry, that did not work. Please try again.' });
    } finally {
      if (mySession === session.current) setRedrawing(false);
    }
  }

  const turn = (id: string, by: number) => {
    const p = paintingsRef.current.find((x) => x.id === id);
    if (p) restyle(id, { turns: addTurns(p.turns, by) });
  };
  const setEnhance = (id: string, on: boolean) => restyle(id, { enhance: on });

  async function fullResult(p: Painting): Promise<Blob> {
    const key = resultKey(p);
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

  /** The full-size picture if it's already made, so the share sheet can open while the tap is fresh. */
  function cachedFull(p: Painting): Blob | null {
    const hit = fullCache.current.get(p.id);
    return hit && hit.key === resultKey(p) ? hit.blob : null;
  }

  async function download() {
    const list = ready();
    if (!list.length) return;
    const target = saveTarget();
    const single = list.length === 1 && paintingsRef.current.length === 1;
    setSaveStatus({ kind: 'working', what: 'download' });
    try {
      const files: { blob: Blob; originalName: string }[] = [];
      for (const p of list) files.push({ blob: cachedFull(p) ?? (await fullResult(p)), originalName: p.name });

      if (target === 'photos') {
        // iPhone and iPad: the share sheet's "Save Image" puts them in Photos.
        const shared = shareFiles(files);
        if (shared) {
          try {
            await navigator.share({ files: shared });
            setSaveStatus({ kind: 'downloaded' });
          } catch (e) {
            const name = (e as Error)?.name;
            if (name === 'AbortError') setSaveStatus({ kind: 'idle' });
            // Making the pictures took long enough that the tap went stale.
            // They're made now, so a second tap opens the share sheet at once.
            else if (name === 'NotAllowedError') setSaveStatus({ kind: 'error', message: 'Your pictures are ready. Tap the button again to save them.' });
            else throw e;
          }
          return;
        }
      }

      if (single) downloadOne(files[0].blob, files[0].originalName);
      else if (target === 'download') await downloadAll(files);
      else await downloadEach(files);
      setSaveStatus({ kind: 'downloaded' });
    } catch {
      setSaveStatus({ kind: 'error', message: 'Sorry, saving did not work. Please try again.' });
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

  // iPhone and iPad: make the full-size picture ahead of time, so tapping
  // "Save" can open the share sheet straight away.
  const warmKey = view === 'save' && current && current.resultUrl ? `${current.id}|${resultKey(current)}` : null;
  useEffect(() => {
    if (!warmKey || saveTarget() !== 'photos') return;
    const p = paintingsRef.current.find((x) => warmKey.startsWith(`${x.id}|`));
    if (p) fullResult(p).catch(() => {});
  }, [warmKey]);

  const step: StepName = view === 'photo' ? 'photo' : view === 'save' || view === 'saved' ? 'save' : 'straighten';
  const backFromStraighten = isBatch ? () => setView('wall') : startOver;
  const backLabel = isBatch ? 'Back to all paintings' : 'Back to photo';
  const backFromSave = () => {
    setSaveStatus({ kind: 'idle' });
    setView(current?.detection?.painting && mode === 'auto' ? 'found' : 'adjust');
  };
  const phoneBack = view === 'found' || view === 'adjust' ? backFromStraighten : view === 'save' ? backFromSave : undefined;

  const Found = phone ? PhoneFound : FoundView;
  const Adjust = phone ? PhoneAdjust : AdjustView;

  return (
    <div className="min-h-dvh flex flex-col">
      <Header step={step} count={paintings.length} onHome={startOver} className="max-sm:hidden" />
      <PhoneHeader
        step={step}
        onHome={startOver}
        onBack={phoneBack}
        className="sm:hidden"
        right={
          view === 'adjust' ? (
            <IconButton label="Magnifier" pressed={magnifier} onClick={() => setMagnifier(!magnifier)}>
              <MagnifierIcon className="w-[22px] h-[22px]" />
            </IconButton>
          ) : undefined
        }
      />

      {view === 'photo' && <PhotoStep mode={mode} onModeChange={setMode} onFiles={addFiles} busy={opening} error={photoError} />}

      {view === 'finding' && current && (phone ? <PhoneFinding src={current.displayUrl} name={current.name} /> : <FindingView src={current.displayUrl} name={current.name} />)}

      {view === 'found' && current && (
        <Found
          src={current.displayUrl}
          name={current.name}
          corners={displayQuad(activeCorners(current), current.turns)}
          suggestedTurns={current.suggestedTurns}
          onTurn={(by) => turn(current.id, by)}
          enhance={current.enhance}
          onEnhance={(on) => setEnhance(current.id, on)}
          turning={redrawing}
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
        <Adjust
          src={current.displayUrl}
          name={current.name}
          corners={displayQuad(current.corners, current.turns)}
          onChange={(corners: Quad) => patch(current.id, { corners: fromDisplay(corners, current.turns) })}
          onDone={(corners: Quad) => finish(current.id, { corners: fromDisplay(corners, current.turns), includeFrame: false })}
          onTurn={(by) => turn(current.id, by)}
          enhance={current.enhance}
          onEnhance={(on) => setEnhance(current.id, on)}
          turning={redrawing}
          onBack={backFromStraighten}
          backLabel={backLabel}
          notice={notice}
          busy={busy}
          magnifier={magnifier}
        />
      )}

      {view === 'save' && current &&
        (phone ? (
          <PhoneSave
            painting={current}
            status={saveStatus}
            onGoogle={saveToGoogle}
            onDownload={download}
            onDimensions={(text) => finish(current.id, { dimensions: text })}
            onAnother={startOver}
          />
        ) : (
          <SaveStep
            painting={current}
            status={saveStatus}
            onGoogle={saveToGoogle}
            onDownload={download}
            onDimensions={(text) => finish(current.id, { dimensions: text })}
            onBack={backFromSave}
            onAnother={startOver}
          />
        ))}

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
          onTurn={turn}
          redrawing={redrawing}
          onGoogle={saveToGoogle}
          onDownload={download}
          onStartOver={startOver}
        />
      )}

      {view === 'saved' && <SavedStep paintings={paintings.filter((p) => savedIds.includes(p.id))} albumUrl={albumUrl} onNew={startOver} />}
    </div>
  );
}
