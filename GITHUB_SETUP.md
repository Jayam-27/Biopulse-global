# Deploying BioPulse Global on GitHub Pages + GitHub Actions

Skips Replit entirely. You edit in VS Code, push to GitHub, and GitHub
handles both hosting (Pages) and the scheduled data refresh (Actions) —
no third-party dashboard beyond GitHub itself.

## What's already set up for this

- `.github/workflows/refresh-data.yml` — a GitHub Actions workflow that
  runs every 6 hours (edit the cron line to change that), installs
  `feedparser` + `yfinance`, runs `scripts/refresh_all.py`, and commits the
  updated `data/news.json`, `data/stocks.json`, `data/commodities.json`
  straight back to the repo if anything changed.
- Everything else (`index.html`, `styles.css`, `app.js`, `data/`, etc.) is
  already plain static files — GitHub Pages can serve them with zero build
  step.

## Steps

1. **Create a GitHub repo.** New repo on github.com (public — GitHub Pages
   needs a public repo unless you're on GitHub Pro/Team/Enterprise, which
   support private Pages).

2. **Push this folder.** In VS Code's terminal, from this folder:
   ```
   git init
   git add .
   git commit -m "Initial BioPulse Global site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<repo-name>.git
   git push -u origin main
   ```
   (Or use VS Code's built-in Source Control panel instead of the CLI —
   same result.)

3. **Enable GitHub Pages.**
   - On the repo page: Settings → Pages.
   - Source: "Deploy from a branch."
   - Branch: `main`, folder: `/ (root)`.
   - Save. GitHub gives you a URL like
     `https://<your-username>.github.io/<repo-name>/` — this is your public
     site, live in a minute or two.

4. **Let Actions write back to the repo.** Actions needs permission to push
   the auto-refreshed data files:
   - Settings → Actions → General → Workflow permissions.
   - Select "Read and write permissions."
   - Save.

5. **Confirm the workflow runs.** Go to the Actions tab, find "Refresh
   biotech news and market data," and click "Run workflow" to trigger it
   manually the first time rather than waiting up to 6 hours. Check the run
   logs — you should see it fetch news and market data and (if anything
   changed) commit.

6. **Check the site.** Reload your Pages URL — the Markets tab prices
   should now show real numbers instead of "Not fetched yet."

## Day-to-day workflow after this

- **Edit anything** (add a source, tweak styling, change the ticker list)
  in VS Code, then `git add . && git commit -m "..." && git push`. Pages
  redeploys automatically within a minute or so.
- **Data refreshes itself** every 6 hours via the Actions workflow — you
  don't need to do anything for that part.
- **Add a manual news pick or ticker:** send it to me in chat, I'll hand you
  the updated JSON snippet, you paste it into `data/manual.json` or
  `watchlist.json` in VS Code and push.

## If you don't want a public repo

GitHub Pages on a private repo requires GitHub Pro (or Team/Enterprise). If
that's a blocker, Netlify or Vercel both support deploying private repos on
their free tiers with a similar "connect repo → auto-deploy on push" flow —
say the word and I'll write that version instead. You'd still use the same
GitHub Actions workflow for the data refresh; only the hosting step changes.
