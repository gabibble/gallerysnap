/* GallerySnap image worker: corner detection and perspective warp with OpenCV.js.
 * Runs off the main thread so the page stays responsive on big photos.
 *
 * Messages in:  { id, type: 'detect', image: {data,width,height} }
 *               { id, type: 'warp', image: {data,width,height}, corners: [{x,y} x4 in px], width, height }
 * Messages out: { id, ok: true, result } | { id, ok: false, error }
 */
/* global importScripts, cv, GallerySnapDetect */
var ready = new Promise(function (resolve, reject) {
  try {
    importScripts('/cv/opencv.js', '/cv/detect.js');
  } catch (e) {
    reject(e);
    return;
  }
  // The WASM runtime starts asynchronously after the script loads. Note: the
  // cv object is "thenable", so never resolve a promise *with* it.
  if (self.cv && self.cv.Mat) resolve();
  else if (self.cv) self.cv.onRuntimeInitialized = function () { resolve(); };
  else reject(new Error('OpenCV.js did not load'));
});

function toImageData(img) {
  var data = img.data instanceof Uint8ClampedArray ? img.data : new Uint8ClampedArray(img.data);
  return { data: data, width: img.width, height: img.height };
}

function warp(img, corners, outW, outH) {
  var src = cv.matFromImageData(toImageData(img));
  var dst = new cv.Mat();
  var from = cv.matFromArray(4, 1, cv.CV_32FC2, [
    corners[0].x, corners[0].y, corners[1].x, corners[1].y,
    corners[2].x, corners[2].y, corners[3].x, corners[3].y,
  ]);
  var to = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, outW, 0, outW, outH, 0, outH]);
  var m = cv.getPerspectiveTransform(from, to);
  try {
    cv.warpPerspective(src, dst, m, new cv.Size(outW, outH), cv.INTER_CUBIC, cv.BORDER_REPLICATE, new cv.Scalar());
    // Copy out of WASM memory before freeing.
    var out = new Uint8ClampedArray(dst.data);
    return { data: out, width: outW, height: outH };
  } finally {
    src.delete(); dst.delete(); from.delete(); to.delete(); m.delete();
  }
}

self.onmessage = function (e) {
  var msg = e.data;
  ready.then(function () {
    if (msg.type === 'detect') {
      var r = GallerySnapDetect.detect(cv, toImageData(msg.image));
      delete r.debug;
      self.postMessage({ id: msg.id, ok: true, result: r });
    } else if (msg.type === 'warp') {
      var out = warp(msg.image, msg.corners, msg.width, msg.height);
      self.postMessage({ id: msg.id, ok: true, result: out }, [out.data.buffer]);
    } else {
      throw new Error('Unknown message ' + msg.type);
    }
  }).catch(function (err) {
    self.postMessage({ id: msg.id, ok: false, error: String((err && err.message) || err) });
  });
};
