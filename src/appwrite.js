// Appwrite helper module
// - Configures the Appwrite client using environment variables
// - Exposes small helpers used by the app to read and write documents
import { Client, Databases, ID, Query } from 'appwrite'

// Environment variables (set these in project .env as VITE_... values)
// - VITE_APPWRITE_PROJECT_ID: Appwrite project identifier
// - VITE_APPWRITE_DATABASE_ID: database id where the collection lives
// - VITE_APPWRITE_COLLECTION_ID: collection id that stores search counters
const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID;
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const COLLECTION_ID = import.meta.env.VITE_APPWRITE_COLLECTION_ID;

// Create and configure Appwrite client
// Consider making the endpoint configurable (VITE_APPWRITE_ENDPOINT) if you run multiple environments
const client = new Client()
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject(PROJECT_ID)

// Databases API instance used for listDocuments, createDocument, updateDocument
const database = new Databases(client);

// updateSearchCount(searchTerm, movie)
// - If a document for the `searchTerm` exists: increment its `count` field
// - Otherwise: create a new document with `count: 1` and save some movie metadata
// Notes:
// - This function logs errors and does not rethrow; callers should be tolerant of failures.
// - For security, ensure collection permissions/CORS are configured in Appwrite console.
export const updateSearchCount = async (searchTerm, movie) => {
  // 1. Use Appwrite SDK to check if the search term exists in the database
 try {
  const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.equal('searchTerm', searchTerm),
  ])

  // 2. If it does, update the count
  if(result.documents.length > 0) {
   const doc = result.documents[0];

   await database.updateDocument(DATABASE_ID, COLLECTION_ID, doc.$id, {
    count: doc.count + 1,
   })
  // 3. If it doesn't, create a new document with the search term and count as 1
  } else {
   await database.createDocument(DATABASE_ID, COLLECTION_ID, ID.unique(), {
    searchTerm,
    count: 1,
    movie_id: movie.id,
    poster_url: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
   })
  }
 } catch (error) {
  console.error(error);
 }
}

// getTrendingMovies(): returns top documents ordered by `count`
// - Useful to display trending searches or movie posters on the homepage
export const getTrendingMovies = async () => {
 try {
  const result = await database.listDocuments(DATABASE_ID, COLLECTION_ID, [
    Query.limit(5),
    Query.orderDesc("count")
  ])

  return result.documents;
 } catch (error) {
  console.error(error);
 }
}