/*
 * GallerySnap corner detection.
 *
 * Plain JavaScript so the same file runs inside the browser Web Worker
 * (via importScripts) and in Node for the detection tests.
 *
 *   GallerySnapDetect.detect(cv, imageData) -> {
 *     painting: { corners: [{x,y} x4], score } | null,   // normalised 0..1, TL TR BR BL
 *     frame:    { corners: [{x,y} x4], score } | null,   // outer edge of a frame, if one was found
 *     confidence: 0..1,
 *   }
 *
 * How it works, in short:
 *   1. Shrink the photo to ~1000px and make two edge maps (a gentle one and a
 *      heavily smoothed one that ignores busy textures like wicker or wood grain).
 *   2. Collect candidate quadrilaterals two ways: closed contours that simplify to
 *      four corners, and pairs of long straight lines (top/bottom x left/right).
 *   3. Score every candidate by how much of each side lies on an edge and how
 *      consistently the colour changes across that side.
 *   4. Pick the outermost strong quad (the painting, or its frame), then look for
 *      a strong quad nested inside it (the painting inside a frame).
 */
(function (root) {
  'use strict';

  var WORK_SIZE = 1000;

  // ---------- geometry helpers ----------

  function orderCorners(pts) {
    // Order 4 points as TL, TR, BR, BL around their centroid.
    var cx = 0, cy = 0;
    pts.forEach(function (p) { cx += p.x; cy += p.y; });
    cx /= 4; cy /= 4;
    var sorted = pts.slice().sort(function (a, b) {
      return Math.atan2(a.y - cy, a.x - cx) - Math.atan2(b.y - cy, b.x - cx);
    });
    // atan2 order from -PI: TL(-135) TR(-45) BR(45) BL(135) for an upright quad
    // Rotate so the first point is the one with the smallest x+y.
    var best = 0, bestV = Infinity;
    for (var i = 0; i < 4; i++) {
      var v = sorted[i].x + sorted[i].y;
      if (v < bestV) { bestV = v; best = i; }
    }
    return [0, 1, 2, 3].map(function (k) { return sorted[(best + k) % 4]; });
  }

  function polyArea(q) {
    var a = 0;
    for (var i = 0; i < q.length; i++) {
      var p = q[i], n = q[(i + 1) % q.length];
      a += p.x * n.y - n.x * p.y;
    }
    return Math.abs(a) / 2;
  }

  function isConvex(q) {
    var sign = 0;
    for (var i = 0; i < 4; i++) {
      var a = q[i], b = q[(i + 1) % 4], c = q[(i + 2) % 4];
      var cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
      if (Math.abs(cross) < 1e-6) return false;
      var s = cross > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
    return true;
  }

  function cornerAnglesOk(q, minDeg, maxDeg) {
    for (var i = 0; i < 4; i++) {
      var p = q[(i + 3) % 4], c = q[i], n = q[(i + 1) % 4];
      var ax = p.x - c.x, ay = p.y - c.y, bx = n.x - c.x, by = n.y - c.y;
      var cos = (ax * bx + ay * by) / (Math.hypot(ax, ay) * Math.hypot(bx, by));
      var deg = Math.acos(Math.max(-1, Math.min(1, cos))) * 180 / Math.PI;
      if (deg < minDeg || deg > maxDeg) return false;
    }
    return true;
  }

  function pointInQuad(p, q) {
    // q is convex, ordered; check same side for all edges
    var sign = 0;
    for (var i = 0; i < 4; i++) {
      var a = q[i], b = q[(i + 1) % 4];
      var cross = (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
      var s = cross > 0 ? 1 : -1;
      if (sign === 0) sign = s;
      else if (s !== sign) return false;
    }
    return true;
  }

  function distPointToSeg(p, a, b) {
    var dx = b.x - a.x, dy = b.y - a.y;
    var t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy);
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
  }

  // Smallest distance from any corner of `inner` to the edges of `outer`.
  function insetDistance(inner, outer) {
    var m = Infinity;
    for (var i = 0; i < 4; i++) {
      for (var j = 0; j < 4; j++) {
        m = Math.min(m, distPointToSeg(inner[i], outer[j], outer[(j + 1) % 4]));
      }
    }
    return m;
  }

  function quadDistance(a, b) {
    var d = 0;
    for (var i = 0; i < 4; i++) d = Math.max(d, Math.hypot(a[i].x - b[i].x, a[i].y - b[i].y));
    return d;
  }

  // ---------- line helpers ----------

  function lineFromSeg(x1, y1, x2, y2) {
    // Normal form: x*cos(t) + y*sin(t) = r, with t in [0, PI)
    var t = Math.atan2(x2 - x1, -(y2 - y1)); // normal direction
    if (t < 0) t += Math.PI;
    if (t >= Math.PI) t -= Math.PI;
    var r = x1 * Math.cos(t) + y1 * Math.sin(t);
    return { t: t, r: r, len: Math.hypot(x2 - x1, y2 - y1) };
  }

  function intersect(l1, l2) {
    var c1 = Math.cos(l1.t), s1 = Math.sin(l1.t), c2 = Math.cos(l2.t), s2 = Math.sin(l2.t);
    var det = c1 * s2 - s1 * c2;
    if (Math.abs(det) < 1e-9) return null;
    return { x: (l1.r * s2 - s1 * l2.r) / det, y: (c1 * l2.r - l1.r * c2) / det };
  }

  function clusterLines(lines, diag) {
    // Greedy clustering of similar lines, longest first.
    lines.sort(function (a, b) { return b.len - a.len; });
    var clusters = [];
    lines.forEach(function (l) {
      for (var i = 0; i < clusters.length; i++) {
        var c = clusters[i];
        var dt = Math.abs(c.t - l.t);
        var r = l.r;
        if (dt > Math.PI / 2) { dt = Math.PI - dt; r = -r; }
        if (dt < 1.5 * Math.PI / 180 && Math.abs(c.r - r) < 0.005 * diag) {
          c.weight += l.len;
          return;
        }
      }
      clusters.push({ t: l.t, r: l.r, weight: l.len, len: l.len });
    });
    return clusters;
  }

  // ---------- scoring ----------

  function makeScorer(edge, lab, w, h) {
    var off = Math.max(3, Math.round(Math.min(w, h) * 0.005));
    var band = Math.max(4, Math.round(Math.min(w, h) * 0.014));

    // Average colour of a short band of pixels running from `start` px to
    // `start + band` px away from the line, along the normal.
    function bandAt(x, y, nx, ny, sign) {
      var acc = [0, 0, 0];
      for (var s = 0; s < 3; s++) {
        var dist = off + (band * s) / 2;
        var p = labAt(x + sign * nx * dist, y + sign * ny * dist);
        acc[0] += p[0]; acc[1] += p[1]; acc[2] += p[2];
      }
      return [acc[0] / 3, acc[1] / 3, acc[2] / 3];
    }

    function labAt(x, y) {
      x = Math.max(0, Math.min(w - 1, Math.round(x)));
      y = Math.max(0, Math.min(h - 1, Math.round(y)));
      var i = (y * w + x) * 3;
      return [lab[i], lab[i + 1], lab[i + 2]];
    }

    function sideScore(a, b, centroid) {
      var len = Math.hypot(b.x - a.x, b.y - a.y);
      var n = Math.max(24, Math.floor(len / 2));
      var nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
      // Make the normal point inwards (towards the centroid).
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if ((centroid.x - mx) * nx + (centroid.y - my) * ny < 0) { nx = -nx; ny = -ny; }
      var edgeHits = 0, contrastHits = 0, valid = 0;
      var sumIn = [0, 0, 0], sumOut = [0, 0, 0];
      var start = Math.floor(n * 0.04), end = n - start; // ignore the very corners
      for (var k = start; k <= end; k++) {
        var t = k / n;
        var x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
        var xi = Math.round(x), yi = Math.round(y);
        if (xi < 0 || yi < 0 || xi >= w || yi >= h) continue;
        valid++;
        if (edge[yi * w + xi]) edgeHits++;
        var pin = bandAt(x, y, nx, ny, 1);
        var pout = bandAt(x, y, nx, ny, -1);
        var d = Math.hypot(pin[0] - pout[0], (pin[1] - pout[1]) * 1.5, (pin[2] - pout[2]) * 1.5);
        if (d > 20) contrastHits++;
        for (var c = 0; c < 3; c++) { sumIn[c] += pin[c]; sumOut[c] += pout[c]; }
      }
      if (valid < 10) return { score: 0, coverage: 0, outMean: [0, 0, 0] };
      var coverage = valid / (end - start + 1);
      var es = edgeHits / valid, cs = contrastHits / valid;
      var meanDiff = Math.hypot(
        (sumIn[0] - sumOut[0]) / valid,
        (sumIn[1] - sumOut[1]) / valid * 1.5,
        (sumIn[2] - sumOut[2]) / valid * 1.5
      );
      // meanDiff rewards a consistent change of colour along the whole side
      // (a real edge) over a texture that flickers back and forth.
      var md = Math.min(1, meanDiff / 45);
      return {
        score: (0.3 * es + 0.35 * cs + 0.35 * md) * coverage,
        coverage: coverage,
        outMean: [sumOut[0] / valid, sumOut[1] / valid, sumOut[2] / valid],
      };
    }

    return function score(q) {
      var cx = 0, cy = 0;
      q.forEach(function (p) { cx += p.x; cy += p.y; });
      var centroid = { x: cx / 4, y: cy / 4 };
      var s = [], outs = [];
      for (var i = 0; i < 4; i++) {
        var r = sideScore(q[i], q[(i + 1) % 4], centroid);
        s.push(r.score);
        outs.push(r.outMean);
      }
      var min = Math.min.apply(null, s);
      var mean = (s[0] + s[1] + s[2] + s[3]) / 4;
      // Ring consistency: whatever surrounds a painting (a liner, a mat, a wall,
      // a table) usually looks the same on every side. A quad stitched together
      // from unrelated lines has a different colour outside each side. One odd
      // side is allowed (a frame standing on a table).
      function cd(a, b) { return Math.hypot(a[0] - b[0], (a[1] - b[1]) * 1.5, (a[2] - b[2]) * 1.5); }
      function spreadOf(list) {
        var m = 0;
        for (var i2 = 0; i2 < list.length; i2++) for (var j2 = i2 + 1; j2 < list.length; j2++) m = Math.max(m, cd(list[i2], list[j2]));
        return m;
      }
      var loose = Infinity;
      for (var skip = 0; skip < 4; skip++) {
        loose = Math.min(loose, spreadOf(outs.filter(function (_, k) { return k !== skip; })));
      }
      var ringStrict = 1 - Math.min(1, spreadOf(outs) / 40);
      var ringLoose = 1 - Math.min(1, loose / 40);
      var base = 0.55 * min + 0.45 * mean;
      return { score: base * (0.75 + 0.25 * ringLoose), base: base, ringStrict: ringStrict, ringLoose: ringLoose, sides: s };
    };
  }

  // ---------- main ----------

  function detect(cv, imageData) {
    var mats = [];
    function track(m) { mats.push(m); return m; }
    try {
      var src = track(cv.matFromImageData(imageData));
      var scale = Math.min(1, WORK_SIZE / Math.max(src.cols, src.rows));
      var small = track(new cv.Mat());
      if (scale < 1) {
        cv.resize(src, small, new cv.Size(Math.round(src.cols * scale), Math.round(src.rows * scale)), 0, 0, cv.INTER_AREA);
      } else {
        src.copyTo(small);
      }
      var w = small.cols, h = small.rows, diag = Math.hypot(w, h), minDim = Math.min(w, h);
      var imgArea = w * h;

      var rgb = track(new cv.Mat());
      cv.cvtColor(small, rgb, cv.COLOR_RGBA2RGB);
      var gray = track(new cv.Mat());
      cv.cvtColor(rgb, gray, cv.COLOR_RGB2GRAY);

      // Lab for contrast checks, lightly blurred.
      var labBlur = track(new cv.Mat());
      cv.GaussianBlur(rgb, labBlur, new cv.Size(5, 5), 0);
      var lab = track(new cv.Mat());
      cv.cvtColor(labBlur, lab, cv.COLOR_RGB2Lab);

      // Edge maps: gentle and heavily smoothed (texture-robust).
      var k1 = Math.max(3, (Math.round(minDim / 200) | 1));
      var g1 = track(new cv.Mat());
      cv.GaussianBlur(gray, g1, new cv.Size(k1 | 1, k1 | 1), 0);
      var g2 = track(new cv.Mat());
      var k2 = Math.max(5, (Math.round(minDim / 60) | 1));
      cv.medianBlur(gray, g2, k2 | 1);
      var g2b = track(new cv.Mat());
      cv.bilateralFilter(g2, g2b, 9, 60, 9);

      // Fixed thresholds work better than median-based ones: a bright photo
      // (cream wall, pale frame) otherwise ends up with almost no edges.
      var edgeMaps = [];
      [[g1, 40, 120], [g2b, 20, 60], [g2b, 10, 35]].forEach(function (cfg) {
        var e = track(new cv.Mat());
        cv.Canny(cfg[0], e, cfg[1], cfg[2]);
        edgeMaps.push(e);
      });

      // Scoring edge map: union of gentle + smoothed edges, dilated by ~2px.
      var scoreEdge = track(new cv.Mat());
      cv.bitwise_or(edgeMaps[0], edgeMaps[1], scoreEdge);
      var kern = track(cv.Mat.ones(3, 3, cv.CV_8U));
      var scoreEdgeD = track(new cv.Mat());
      cv.dilate(scoreEdge, scoreEdgeD, kern);
      var scorer = makeScorer(scoreEdgeD.data, lab.data, w, h);

      var candidates = [];
      function addCandidate(pts, source) {
        if (pts.length !== 4) return;
        var q = orderCorners(pts);
        var margin = 0.03 * minDim;
        for (var i = 0; i < 4; i++) {
          if (q[i].x < -margin || q[i].y < -margin || q[i].x > w + margin || q[i].y > h + margin) return;
        }
        if (!isConvex(q)) return;
        var area = polyArea(q);
        if (area < 0.06 * imgArea || area > 1.02 * imgArea) return;
        if (!cornerAnglesOk(q, 50, 130)) return;
        for (var j = 0; j < candidates.length; j++) {
          if (quadDistance(candidates[j].q, q) < 0.006 * diag) return; // duplicate
        }
        var s = scorer(q);
        candidates.push({ q: q, area: area / imgArea, score: s.score, base: s.base, ringStrict: s.ringStrict, sides: s.sides, source: source });
      }

      // --- candidates from contours ---
      var dilK = track(cv.Mat.ones(3, 3, cv.CV_8U));
      edgeMaps.forEach(function (e) {
        var d = new cv.Mat();
        cv.dilate(e, d, dilK);
        var contours = new cv.MatVector();
        var hier = new cv.Mat();
        cv.findContours(d, contours, hier, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
        for (var i = 0; i < contours.size(); i++) {
          var cnt = contours.get(i);
          var hull = new cv.Mat();
          cv.convexHull(cnt, hull, false, true);
          var hullArea = cv.contourArea(hull);
          if (hullArea > 0.06 * imgArea) {
            var peri = cv.arcLength(hull, true);
            [0.02, 0.035, 0.05].forEach(function (eps) {
              var approx = new cv.Mat();
              cv.approxPolyDP(hull, approx, eps * peri, true);
              if (approx.rows === 4) {
                var pts = [];
                for (var k = 0; k < 4; k++) pts.push({ x: approx.data32S[2 * k], y: approx.data32S[2 * k + 1] });
                addCandidate(pts, 'contour');
              }
              approx.delete();
            });
          }
          hull.delete();
          cnt.delete();
        }
        contours.delete(); hier.delete(); d.delete();
      });

      // --- candidates from straight lines ---
      var allLines = [];
      edgeMaps.forEach(function (e) {
        var lines = new cv.Mat();
        cv.HoughLinesP(e, lines, 1, Math.PI / 360, Math.round(minDim * 0.08), minDim * 0.12, minDim * 0.02);
        for (var i = 0; i < lines.rows; i++) {
          var p = lines.data32S.subarray(i * 4, i * 4 + 4);
          allLines.push(lineFromSeg(p[0], p[1], p[2], p[3]));
        }
        lines.delete();
      });
      var clusters = clusterLines(allLines, diag);
      // t near PI/2 => horizontal line (normal points down); t near 0 or PI => vertical.
      var horiz = [], vert = [];
      clusters.forEach(function (c) {
        var deg = c.t * 180 / Math.PI;
        if (deg > 50 && deg < 130) horiz.push(c);
        else if (deg < 40 || deg > 140) vert.push(c);
      });
      horiz.sort(function (a, b) { return b.weight - a.weight; });
      vert.sort(function (a, b) { return b.weight - a.weight; });
      if (root.GALLERYSNAP_DEBUG) root.GALLERYSNAP_LINES = { horiz: horiz.map(function (c) { return [Math.round(c.t * 180 / Math.PI), Math.round(c.r), Math.round(c.weight)]; }), vert: vert.map(function (c) { return [Math.round(c.t * 180 / Math.PI), Math.round(c.r), Math.round(c.weight)]; }) };
      horiz = horiz.slice(0, 14);
      vert = vert.slice(0, 14);
      function yAt(l, x) { return (l.r - x * Math.cos(l.t)) / Math.sin(l.t); }
      function xAt(l, y) { return (l.r - y * Math.sin(l.t)) / Math.cos(l.t); }
      for (var a = 0; a < horiz.length; a++) {
        for (var b = a + 1; b < horiz.length; b++) {
          var top = horiz[a], bot = horiz[b];
          if (yAt(top, w / 2) > yAt(bot, w / 2)) { var tmp = top; top = bot; bot = tmp; }
          if (yAt(bot, w / 2) - yAt(top, w / 2) < 0.2 * h) continue;
          for (var c = 0; c < vert.length; c++) {
            for (var d = c + 1; d < vert.length; d++) {
              var left = vert[c], right = vert[d];
              if (xAt(left, h / 2) > xAt(right, h / 2)) { var t2 = left; left = right; right = t2; }
              if (xAt(right, h / 2) - xAt(left, h / 2) < 0.2 * w) continue;
              var p1 = intersect(top, left), p2 = intersect(top, right), p3 = intersect(bot, right), p4 = intersect(bot, left);
              if (!p1 || !p2 || !p3 || !p4) continue;
              addCandidate([p1, p2, p3, p4], 'lines');
            }
          }
        }
      }

      var result = choose(candidates, w, h, minDim);
      if (result.painting) {
        result.painting = { q: refineQuad(result.painting.q, lab.data, w, h, !!result.frame), score: result.painting.score };
      }
      function norm(q) { return q.map(function (p) { return { x: clamp01(p.x / w), y: clamp01(p.y / h) }; }); }
      return {
        painting: result.painting ? { corners: norm(result.painting.q), score: round3(result.painting.score) } : null,
        frame: result.frame ? { corners: norm(result.frame.q), score: round3(result.frame.score) } : null,
        confidence: round3(result.confidence),
        // The strongest other outlines, so an AI suggestion can be snapped onto a
        // real edge in the photo.
        candidates: candidates.slice().sort(function (a2, b2) { return b2.score - a2.score; }).slice(0, 60).map(function (c) {
          return { corners: norm(c.q), score: round3(c.score) };
        }),
        debug: { candidates: candidates.length, lines: clusters.length, workSize: [w, h], all: root.GALLERYSNAP_DEBUG ? candidates.map(function (c) { return { q: norm(c.q), score: round3(c.score), sides: c.sides.map(round3), ring: round3(c.ringStrict), area: round3(c.area), source: c.source }; }) : undefined },
      };
    } finally {
      mats.forEach(function (m) { try { m.delete(); } catch { /* already freed */ } });
    }
  }

  // Nudge each side of a quad to the sharpest colour step nearby. With
  // `preferInner`, take the innermost step that is nearly as sharp as the
  // sharpest one: inside a frame the canvas edge is the last step before paint.
  function refineQuad(q, lab, w, h, preferInner) {
    var minDim = Math.min(w, h);
    var R = Math.max(3, Math.round(minDim * 0.015));
    var cx = 0, cy = 0;
    q.forEach(function (p) { cx += p.x / 4; cy += p.y / 4; });
    function labAt(x, y) {
      x = Math.max(0, Math.min(w - 1, Math.round(x)));
      y = Math.max(0, Math.min(h - 1, Math.round(y)));
      var i = (y * w + x) * 3;
      return [lab[i], lab[i + 1], lab[i + 2]];
    }
    var lines = [];
    for (var i = 0; i < 4; i++) {
      var a = q[i], b = q[(i + 1) % 4];
      var len = Math.hypot(b.x - a.x, b.y - a.y);
      var nx = -(b.y - a.y) / len, ny = (b.x - a.x) / len;
      var mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      if ((cx - mx) * nx + (cy - my) * ny < 0) { nx = -nx; ny = -ny; }
      var strengths = [];
      for (var d = -R; d <= R; d++) {
        var sum = 0, n = 0;
        for (var t = 0.1; t <= 0.9; t += 0.02) {
          var x = a.x + (b.x - a.x) * t + nx * d, y = a.y + (b.y - a.y) * t + ny * d;
          var pin = labAt(x + nx * 2, y + ny * 2), pout = labAt(x - nx * 2, y - ny * 2);
          sum += Math.hypot(pin[0] - pout[0], (pin[1] - pout[1]) * 1.5, (pin[2] - pout[2]) * 1.5);
          n++;
        }
        strengths.push({ d: d, s: sum / n });
      }
      var maxS = strengths.reduce(function (m, v) { return v.s > m ? v.s : m; }, 0);
      // local maxima only
      var peaks = strengths.filter(function (v, k) {
        var prev = strengths[k - 1], next = strengths[k + 1];
        return (!prev || v.s >= prev.s) && (!next || v.s >= next.s);
      });
      var pick;
      if (preferInner) {
        var okPeaks = peaks.filter(function (v) { return v.s >= 0.7 * maxS; });
        pick = okPeaks.reduce(function (m, v) { return v.d > m.d ? v : m; }, okPeaks[0]);
      } else {
        pick = peaks.reduce(function (m, v) { return v.s > m.s ? v : m; }, peaks[0]);
      }
      var shift = pick ? pick.d : 0;
      lines.push({ a: { x: a.x + nx * shift, y: a.y + ny * shift }, b: { x: b.x + nx * shift, y: b.y + ny * shift } });
    }
    function inter(l1, l2) {
      var x1 = l1.a.x, y1 = l1.a.y, x2 = l1.b.x, y2 = l1.b.y, x3 = l2.a.x, y3 = l2.a.y, x4 = l2.b.x, y4 = l2.b.y;
      var den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
      if (Math.abs(den) < 1e-9) return null;
      var px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / den;
      var py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / den;
      return { x: px, y: py };
    }
    var out = [];
    for (var j = 0; j < 4; j++) {
      // corner j is where side j-1 meets side j
      var c = inter(lines[(j + 3) % 4], lines[j]);
      if (!c) return q;
      out.push(c);
    }
    return out;
  }

  function clamp01(v) { return Math.max(0, Math.min(1, v)); }
  function round3(v) { return Math.round(v * 1000) / 1000; }

  var GOOD = 0.5; // a quad scoring above this has clear edges all the way round

  function choose(candidates, w, h, minDim) {
    if (!candidates.length) return { painting: null, frame: null, confidence: 0 };
    var inset = 0.025 * minDim;

    function nestedIn(o) {
      return candidates.filter(function (c) {
        if (c === o) return false;
        if (c.area < 0.25 * o.area || c.area > 0.9 * o.area) return false;
        for (var i = 0; i < 4; i++) if (!pointInQuad(c.q[i], o.q)) return false;
        if (insetDistance(c.q, o.q) < inset) return false;
        return roughlyConcentric(c.q, o.q);
      });
    }

    // 1. Frame case: a strong outer quad (the frame) with a strong quad nested
    //    inside it whose surroundings look the same on all four sides (the
    //    liner or the inner lip of the frame). A quad stitched together from a
    //    painting edge and a frame edge never has a good nested partner, so this
    //    also keeps those mix-ups out.
    var bestPair = null;
    candidates.forEach(function (o) {
      if (o.score < 0.55 || o.area < 0.2) return;
      nestedIn(o).forEach(function (p) {
        if (p.score < 0.6 || p.ringStrict < 0.45) return;
        var v = o.score + p.score + 0.3 * Math.sqrt(o.area);
        if (!bestPair || v > bestPair.v) bestPair = { v: v, o: o, p: p };
      });
    });
    if (bestPair) {
      // The painting is the innermost of the strong nested quads: frames have
      // a liner and several grooves, and the canvas edge is the last one.
      var inner = nestedIn(bestPair.o).filter(function (c) {
        return c.ringStrict >= 0.45 && c.score >= bestPair.p.score * 0.9;
      });
      var painting = inner.reduce(function (m, c) { return c.area < m.area ? c : m; }, bestPair.p);
      return { painting: painting, frame: bestPair.o, confidence: Math.min(1, Math.min(painting.score, bestPair.o.score + 0.1)) };
    }

    // 2. The frame fills the whole photo (the photo was already cropped to the
    //    frame). Then the photo edge is the frame's outer edge, and we need two
    //    nested levels inside it (e.g. the liner and the canvas) to believe it.
    var border = { q: [{ x: 0, y: 0 }, { x: w - 1, y: 0 }, { x: w - 1, y: h - 1 }, { x: 0, y: h - 1 }], area: 1, score: 0.6 };
    var lvl1 = nestedIn(border).filter(function (c) { return c.score >= 0.65 && c.ringStrict >= 0.45 && c.area < 0.85; });
    var bestBorder = null;
    lvl1.forEach(function (q1) {
      nestedIn(q1).forEach(function (p) {
        if (p.score < 0.65 || p.ringStrict < 0.45) return;
        var v = q1.score + p.score;
        if (!bestBorder || v > bestBorder.v) bestBorder = { v: v, q1: q1, p: p };
      });
    });
    if (bestBorder) {
      var innerB = nestedIn(bestBorder.q1).filter(function (c) { return c.ringStrict >= 0.45 && c.score >= bestBorder.p.score * 0.9; });
      var paintingB = innerB.reduce(function (m, c) { return c.area < m.area ? c : m; }, bestBorder.p);
      return { painting: paintingB, frame: border, confidence: Math.min(1, paintingB.score) };
    }

    // 3. No frame: the best quad, with a small preference for bigger ones so a
    //    painting wins over a shape painted inside it.
    var best = candidates.reduce(function (m, c) { return c.score > m.score ? c : m; });
    var strong = candidates.filter(function (c) { return c.score >= Math.max(GOOD, best.score * 0.85); });
    if (!strong.length) strong = [best];
    var outer = strong.reduce(function (m, c) {
      return c.score + 0.3 * Math.sqrt(c.area) > m.score + 0.3 * Math.sqrt(m.area) ? c : m;
    });
    return { painting: outer, frame: null, confidence: Math.min(outer.score, 1) };
  }

  function roughlyConcentric(inner, outer) {
    // A painting sits roughly centred in its frame: the gaps on opposite sides
    // shouldn't differ wildly.
    function gap(i) { return distPointToSeg(mid(inner[i], inner[(i + 1) % 4]), outer[i], outer[(i + 1) % 4]); }
    function mid(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
    var t = gap(0), r = gap(1), b = gap(2), l = gap(3);
    function ratio(a, c) { return Math.max(a, c) / Math.max(1, Math.min(a, c)); }
    return ratio(t, b) < 2.5 && ratio(l, r) < 2.5;
  }

  var api = { detect: detect, _internal: { orderCorners: orderCorners, polyArea: polyArea } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.GallerySnapDetect = api;
})(typeof self !== 'undefined' ? self : globalThis);
