import React from "react";

// MovieCard: presentational component rendering a single movie
// Props:
// - movie: object with fields returned from TMDB (title, vote_average, poster_path, release_date, original_language)
// Behavior:
// - Shows poster (falls back to /no-movie.png)
// - Displays rating (to one decimal) or 'N/A'
// - Extracts year from release_date when available
const MovieCard = ({
  movie: { title, vote_average, poster_path, release_date, original_language },
}) => {
  return (
    <div className="movie-card">
      {/* Poster image: use TMDB image when available otherwise fallback */}
      <img
        src={
          poster_path
            ? `https://image.tmdb.org/t/p/w500/${poster_path}`
            : "/no-movie.png"
        }
        alt={title}
      />

      <div className="mt-4">
        <h3>{title} </h3>

        <div className="content">
          <div className="rating">
            <img src="star.svg" alt="Star Icon" />
            {/* vote_average can be undefined for some records */}
            <p>{vote_average ? vote_average.toFixed(1) : "N/A"} </p>
          </div>
          <span>•</span>

          <p className="lang">{original_language} </p>
          <span>•</span>
          <p className="year">
            {/* release_date may be absent; split on '-' to get year */}
            {release_date ? release_date.split("-")[0] : "N/A"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default MovieCard;
