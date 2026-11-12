# GallerySnap

*Get your art photos cropped and straightened in a snap.*

GallerySnap turns a photo of a painting into a clean, straight, tightly cropped
image for art shows, contests and sharing. Drop in a photo, check the gold
outline, and save it to Google Photos or download it.

## How it works

- **Photo**: drag in one photo or many (JPG, PNG or HEIC), or take one on a phone.
- **Straighten**: the app finds the four corners and fixes the angle. If the
  painting is framed, an "Include the frame" switch appears. You can always
  drag the numbered corners yourself, with a magnifier.
- **Save**: "Save to Google Photos" (into an album called *GallerySnap*) or
  "Download" (`yourphoto_gallerysnap.jpg`). Several photos become a zip.

Photos are processed on the device. Corner finding and straightening run in
the browser with [OpenCV.js](https://docs.opencv.org/). Only when the app
can't find the corners itself does it send a small copy (about 1000px) to an AI
helper, through this app's own server, so the API key stays secret.

## Running it on your computer

You need [Node.js](https://nodejs.org/) 20 or newer.

```bash
npm install
cp .env.example .env.local   # then fill in the values (optional, see below)
npm run dev
```

Then open http://localhost:3000.

Other commands:

| Command | What it does |
| --- | --- |
| `npm test` | Runs the tests, including corner detection on the example photos in `test/fixtures` |
| `npm run detect:samples` | Draws the detected outlines on every photo in `test/fixtures` into `test/fixtures/out/` |
| `npm run lint` | Checks the code style |
| `npm run build` | Builds the production version |

## Settings

Both are optional. Without them the app still works; Google Photos saving is
off and the app asks you to place corners more often.

| Name | What it's for |
| --- | --- |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google sign-in for saving to Google Photos |
| `ANTHROPIC_API_KEY` | The AI helper for tricky photos (secret, server only) |
| `GALLERYSNAP_AI_MODEL` | Optional: which Claude model the helper uses (default `claude-opus-5-5`) |

### Setting up Google Photos

1. Go to [Google Cloud Console](https://console.cloud.google.com/) and create a project (for example "GallerySnap").
2. Open **APIs & Services → Library**, search for **Photos Library API**, and click **Enable**.
3. Open **Google Auth Platform** (or **OAuth consent screen**). Choose **External**, fill in the app name and your email, and save.
   Under **Data access**, add the scopes `.../auth/photoslibrary.appendonly` and `.../auth/photoslibrary.readonly.appcreateddata`.
   Under **Audience**, add the Google accounts that may use it while it is in testing (yours, Chris's).
4. Open **Clients** (or **Credentials → Create credentials → OAuth client ID**), choose **Web application**, and under
   **Authorized JavaScript origins** add `http://localhost:3000` and your Vercel address (for example `https://gallerysnap.vercel.app`).
5. Copy the **Client ID** into `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

While the Google app is in "Testing", only the accounts you list can sign in.
To open it to everyone, submit it for Google's verification from the same page.

### Setting up the AI helper

Create a key at [platform.claude.com](https://platform.claude.com/) and put it in `ANTHROPIC_API_KEY`.

## Deploying on Vercel

1. Sign in at [vercel.com](https://vercel.com) with GitHub.
2. **Add New → Project**, pick the `gallerysnap` repository, and click **Deploy**.
3. In the project's **Settings → Environment Variables**, add the settings above, then redeploy.

Every pull request gets its own preview link automatically.

## Project layout

| Path | What's there |
| --- | --- |
| `src/components/` | The screens: `PhotoStep`, `StraightenStep`, `SaveStep`, `BatchSteps`, and `App` which ties them together |
| `src/lib/pipeline.ts` | What happens to a photo: load, find corners, straighten |
| `src/lib/geometry.ts` | Corner maths and the real shape (aspect ratio) of a photographed painting |
| `src/lib/googlePhotos.ts` | Google sign-in and uploading into the GallerySnap album |
| `src/app/api/corners/route.ts` | The AI helper (server side) |
| `public/cv/detect.js` | Corner detection (runs in the browser worker and in the tests) |
| `public/cv/worker.js` | The background worker that runs OpenCV.js |
