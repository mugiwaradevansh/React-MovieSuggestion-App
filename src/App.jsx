// Main application component
// - Loads movies from TMDB
// - Debounces user search input
// - Shows trending items from Appwrite and records search counts
import { useEffect, useState } from 'react'
import Search from './components/Search.jsx'
import Spinner from './components/Spinner.jsx'
import MovieCard from './components/MovieCard.jsx'
import { useDebounce } from 'react-use'
import { getTrendingMovies, updateSearchCount } from './appwrite.js'

// TMDB API configuration
// - API_BASE_URL: base URL for all TMDB endpoints used in this app
const API_BASE_URL = 'https://api.themoviedb.org/3';

// API_KEY is expected to be provided via Vite env vars: VITE_TMDB_API_KEY
// If this is missing you'll get 401 responses from TMDB. Restart Vite after updating .env.
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

// Default fetch options used for GET requests to TMDB
// Note: Authorization requires a space after `Bearer` (``Bearer ${API_KEY}``).
const API_OPTIONS = {
  method: 'GET',
  headers: {
    accept: 'application/json',
    Authorization: `Bearer ${API_KEY}`
  }
}

const App = () => {
  // debouncedSearchTerm: value used to trigger network fetches after the user stops typing
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  // searchTerm: controlled input value updated on every keystroke
  const [searchTerm, setSearchTerm] = useState('');

  // movieList: array of movie objects returned from TMDB
  const [movieList, setMovieList] = useState([]);
  // errorMessage: human-readable error to show in UI when fetches fail
  const [errorMessage, setErrorMessage] = useState('');
  // isLoading: toggles UI loading indicator while requests are in flight
  const [isLoading, setIsLoading] = useState(false);

  // trendingMovies: documents returned from Appwrite tracking popular searches
  const [trendingMovies, setTrendingMovies] = useState([]);

  // Debounce the search term to prevent making too many API requests
  // by waiting for the user to stop typing for 500ms.
  // react-use's `useDebounce` calls the provided callback after the delay.
  useDebounce(() => setDebouncedSearchTerm(searchTerm), 500, [searchTerm])

  // fetchMovies: fetches movies from TMDB either via search or discover endpoint
  // - If `query` is provided, calls `/search/movie` with the query param
  // - Otherwise fetches popular/discover movies
  // After a successful search (with results) it records the search in Appwrite
  const fetchMovies = async (query = '') => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);

      // HTTP-level check: non-2xx responses will trigger the catch block
      if(!response.ok) {
        throw new Error('Failed to fetch movies');
      }

      const data = await response.json();

      if(data.Response === 'False') {
        setErrorMessage(data.Error || 'Failed to fetch movies');
        setMovieList([]);
        return;
      }

      setMovieList(data.results || []);

      // If this was an actual user search and we got at least one result
      // record the search count in Appwrite (non-blocking for the UI)
      if(query && data.results.length > 0) {
        await updateSearchCount(query, data.results[0]);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      setErrorMessage('Error fetching movies. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();

      setTrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm]);

  useEffect(() => {
    loadTrendingMovies();
  }, []);

  return (
    <main>
      <div className="pattern"/>

      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>Find <span className="text-gradient">Movies</span> You'll Enjoy Without the Hassle</h1>

          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>

          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default App