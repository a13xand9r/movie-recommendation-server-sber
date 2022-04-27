// import axios from 'axios'
import { RecommendationsList } from './types'
import MovieDB from 'node-themoviedb'
require('dotenv').config()

// const axiosMovie = axios.create({
//   baseURL: 'https://api.themoviedb.org/3/',
// });

const mdb = new MovieDB(process.env.MOVIE_API_KEY as string, {language: 'ru'});

export const findMovie = async (query: string) => {
  try{
    const foundMovies = await mdb.search.movies({
      query: {
        query
      }
    })
    if (foundMovies.data.results.length > 0){
      return foundMovies.data
    }
  } catch(e){
    console.log('movie Request error', e)
  }
  return null
}

export const recommendMovies = async (movieId: number) => {
  try {
    const res = await mdb.movie.getRecommendations({
      pathParameters: {
        movie_id: movieId
      }
    })
    console.log(JSON.stringify(res.data))
    return res.data
  } catch (e) {
    console.log('movie Request error', e)
  }
  return null
}

export const getGenres = async () => {
  try {
    const genres = await mdb.genre.getMovieList()
    return genres.data
  } catch (error) {
    console.log('genreError', error)
    return null
  }
}