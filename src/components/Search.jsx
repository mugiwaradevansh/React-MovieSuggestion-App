import React from "react";

// Search component (controlled input)
// Props:
// - searchTerm: current input value (string)
// - setSearchTerm: setter function from parent `useState` to update the value
// Behavior:
// - Updates the parent's `searchTerm` on every keystroke. The parent debounces
//   the value before making network requests to avoid spamming the API.
const Search = ({ searchTerm, setSearchTerm }) => {
  return (
    <div className="search">
      <div>
        {/* Presentational search icon */}
        <img src="search.svg" alt="search" />

        {/* Controlled input: value comes from parent; changes bubble up through setSearchTerm */}
        <input
          type="text"
          placeholder="Search through thousands of movies"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
    </div>
  );
};

export default Search;
