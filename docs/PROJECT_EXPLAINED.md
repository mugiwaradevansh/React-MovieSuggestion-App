## Project explained (beginner-friendly)

This document explains the purpose of each source file in the project, what the important variables do, how the arrow functions behave, what React state is used for, and suggested fixes or improvements where relevant.

Open the files in `src/` while reading this guide — each section maps to one file and explains the important pieces.

---

## `src/appwrite.js`

Purpose

- Sets up the Appwrite client and exposes helper functions used to track search popularity and to get trending items.

Important variables

- `PROJECT_ID` — from `import.meta.env.VITE_APPWRITE_PROJECT_ID`. This identifies your Appwrite project.
- `DATABASE_ID` — from `import.meta.env.VITE_APPWRITE_DATABASE_ID`. The DB that holds collections.
- `COLLECTION_ID` — from `import.meta.env.VITE_APPWRITE_COLLECTION_ID`. The specific collection tracking search counts.
- `client` — instance of `Appwrite.Client` configured with `.setEndpoint(...).setProject(PROJECT_ID)`.
- `database` — `new Databases(client)` used to call `listDocuments`, `createDocument`, and `updateDocument`.

Key functions and behavior

- `updateSearchCount(searchTerm, movie)`

  - Purpose: When a user searches, this increments the counter for that search term or creates a new document if it's the first time.
  - Steps:
    1. List documents in the collection filtered by `searchTerm` (using `Query.equal`).
    2. If a document is found, call `updateDocument` and increment `count`.
    3. If not found, call `createDocument` and save `searchTerm`, `count: 1`, plus `movie_id` and `poster_url`.
  - Error behavior: Any exception is caught and printed to console. In production you should return or rethrow errors so the caller knows the write failed.

- `getTrendingMovies()`
  - Purpose: Retrieve the top documents ordered by `count` (used to render a trending list).
  - Implementation detail: use `Query.limit` and `Query.orderDesc("count")` to filter the returned docs.

Notes, pitfalls and recommended fixes

- Make `ENDPOINT` configurable via `VITE_APPWRITE_ENDPOINT` so you can run against different deployments or localhost.
- Validate that `DATABASE_ID` and `COLLECTION_ID` are set (console error early if missing). This avoids confusing runtime errors.
- Appwrite security: If you allow direct client updates, you must configure collection permissions in Appwrite console. Otherwise, prefer routing writes through a secure server function.

---

## `src/App.jsx`

Purpose

- Main React component. It loads movies from The Movie Database (TMDB) API, allows searching, and displays a trending list powered by Appwrite.

Important variables and constants

- `API_BASE_URL` — base TMDB API URL (`https://api.themoviedb.org/3`).
- `API_KEY` — from `import.meta.env.VITE_TMDB_API_KEY`. Make sure this is present in a `.env` file and you restart Vite after setting it.
- `API_OPTIONS` — default options passed to `fetch`. Note: must include `method: 'GET'` and header `Authorization: `Bearer ${API_KEY}`(with a space after`Bearer`). See notes below.

React state (what each piece does)

- `debouncedSearchTerm` — used together with `useDebounce` to wait until the user stops typing before firing a search; reduces API calls.
- `searchTerm` — controlled value of the search input; updated on every keystroke.
- `movieList` — array of movie objects from TMDB used to render the results list.
- `errorMessage` — a string used to display an error to the user when network or parsing errors occur.
- `isLoading` — boolean showing whether a fetch request is in progress; used to render the `Spinner`.
- `trendingMovies` — array of documents returned from Appwrite (the most-searched items).

Key functions and behavior

- `useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])`

  - What it does: waits 500ms after the last keystroke before updating `debouncedSearchTerm`. This throttle helps avoid one API call per keystroke.

- `fetchMovies(query = '')`

  - Purpose: Issues a fetch request to TMDB. If `query` is empty it calls the discover/popular endpoint; otherwise it calls `/search/movie`.
  - Important checks:
    - Checks `response.ok` and throws a `Failed to fetch movies` error for non-2xx responses.
    - Parses JSON and expects `data.results` to contain the movie array.
    - If the request was a search (`query` supplied) and `data.results` has at least one item, it calls `updateSearchCount(query, data.results[0])` to store usage in Appwrite.
  - Error handling: sets `errorMessage` to a friendly text and logs the error.

- `loadTrendingMovies()`
  - Purpose: loads trending items by calling `getTrendingMovies()` from `appwrite.js` and sets `trendingMovies`.

Common pitfalls and recommended fixes

- API key: `API_KEY` must be defined. If `undefined`, TMDB will likely return 401. Add a console.log while debugging to verify it's loaded.
- Authorization header must contain a space after `Bearer` (``Authorization: `Bearer ${API_KEY}```). Without the space it becomes invalid.
- Response shape: TMDB returns results in `data.results` (not `data.Response` or `data.Error`). Error checks should use the presence/absence of `data.results` or `response.ok`.
- Debounce: `useDebounce` here receives a callback and dependency array. That is correct for `react-use`'s version used in this project.

UI and components

- `Search` — a small controlled input shown in the header. It updates `searchTerm`.
- `Spinner` — shown while loading.
- `MovieCard` — renders a single movie's poster, title, rating and year.

---

## `src/components/Search.jsx`

Purpose

- A presentational controlled input component used to search movies.

Important props

- `searchTerm` — current input value (string).
- `setSearchTerm` — setter function from `useState` that updates the parent state.

How it works

- On each `onChange` the component calls `setSearchTerm(e.target.value)` which updates `searchTerm` in the parent (`App`). The parent debounces the value before making network calls.

Notes

- Keep the component small and focused. If you need to add features (clear button, keyboard shortcuts), add them here so the `App` stays simple.

---

## `src/components/Spinner.jsx`

Purpose

- A small accessible loading indicator shown while data is being fetched.

Important notes / fixes for React

- The SVG markup in the project uses `class` instead of `className`. In React JSX you should use `className`. Change `class="..."` and `class="sr-only"` to `className="..."` to avoid console warnings and ensure classes are properly applied.
- The `role="status"` and `aria-hidden` attributes are useful for accessibility; keep them. The inner visually-hidden `span` with `sr-only` is a good pattern.

---

## `src/components/MovieCard.jsx`

Purpose

- Renders each movie entry in the movies list. Shows poster, title, rating, language and release year.

Props and destructuring

- The component expects a `movie` object. It destructures the common fields: `title`, `vote_average`, `poster_path`, `release_date`, and `original_language`.

Behavior and fallbacks

- Poster: if `poster_path` exists the component loads the image from TMDB; otherwise it falls back to `/no-movie.png`.
- Rating: `vote_average.toFixed(1)` is used if available; otherwise it shows `N/A`.
- Release year: extracted from `release_date` by `release_date.split('-')[0]`.

Edge cases to handle

- Some movies may be missing `release_date` or `poster_path`. The component already handles those.

---

## `src/main.jsx`

Purpose

- Application entry point. Creates React root and renders `<App />` inside the element with id `root`.

Important details

- The code uses `createRoot(document.getElementById('root')).render(...)` which is correct for React 18+.

---

## `package.json`

Purpose

- Lists project metadata and dependencies.

Important dependencies

- `appwrite` — Appwrite SDK used to interact with Appwrite backend.
- `react`, `react-dom` — core React packages.
- `react-use` — utility hooks used for `useDebounce`.
- `tailwindcss` — styling (used via Vite/Tailwind integration).

Notes about versions

- The `appwrite` dependency is present (v21+ in this project). Appwrite had some breaking changes across v7->v8->v10... If you upgrade Appwrite or copy code from older examples, check the SDK docs for the correct function signatures and import paths.

---

## Environment variables you must set

- `VITE_TMDB_API_KEY` — your TMDB Bearer API key (used in `App.jsx`).
- `VITE_APPWRITE_PROJECT_ID` — your Appwrite project ID.
- `VITE_APPWRITE_ENDPOINT` — Appwrite endpoint (e.g. `https://fra.cloud.appwrite.io/v1`). If not present, the app currently has the endpoint hard-coded — consider switching to the env var.
- `VITE_APPWRITE_DATABASE_ID` — ID of the Appwrite database used by `appwrite.js`.
- `VITE_APPWRITE_COLLECTION_ID` — ID of the Appwrite collection used by `appwrite.js`.

Reminder: after changing `.env` you must restart the Vite dev server for `import.meta.env` to pick up new values.

---

## Quick fixes I recommend (apply in source files)

1. `Spinner.jsx` — change `class` attributes to `className`.
2. `appwrite.js` — ensure you use `import.meta.env.VITE_APPWRITE_ENDPOINT` for endpoint, and validate `DATABASE_ID` and `COLLECTION_ID` early (console error if missing).
3. `App.jsx` — add a small guard to log if `API_KEY` is missing; check `data.results` instead of `data.Response`.
4. Add better error propagation from `updateSearchCount` so the UI can react when Appwrite writes fail (optional but helpful).

---

## How to run and debug locally

1. Create a `.env` file at the project root containing the variables from the environment section above.
2. Install dependencies and start the dev server:

```powershell
npm install
npm run dev
```

3. If fetches fail, open the browser devtools Network tab and look at the request/response for TMDB calls and Appwrite calls. Common causes:
   - Missing or wrong API keys → 401 responses.
   - Appwrite CORS not configured for `http://localhost:5173` (or Vite dev URL) → CORS errors in console.
   - Collection permissions deny client writes → 401/403 for create/update requests.

---

## Final notes for beginners

- Read the small functions first (`updateSearchCount`, `fetchMovies`) and follow the data flow: user types → `Search` updates `searchTerm` → `useDebounce` eventually updates `debouncedSearchTerm` → `fetchMovies` runs → UI shows results and writes to Appwrite.
- Keep UI and logic separated: `Search` only controls the input; `App` handles network calls and state.
- Use the browser console and Network tab to inspect requests (headers, response bodies). This is the fastest way to understand why something failed.

If you want, I can now automatically:

- Apply the three small fixes (Spinner `className`, add endpoint env usage in `appwrite.js`, and add an `API_KEY` guard in `App.jsx`) and run the dev server to verify. Tell me if you'd like me to make those code changes now.
