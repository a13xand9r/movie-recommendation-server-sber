import MovieDB from 'node-themoviedb';
import { recommendMovies } from '../movieApi';
import { pluralization, tvShowName } from './fixTextObjects';

export function getRandomFromArray<T>(arr: T[]): T {
  return arr[Math.floor(arr.length * Math.random())]
}


const changeText = <T extends object>(text: string, changeObj: T) => {
  let newText: string = text
  const keys = Object.keys(changeObj)
  keys.forEach((key) => {
    if (text.toLowerCase().includes(key.toLowerCase())) {
      //@ts-ignore
      newText = text.replace(key, changeObj[key])
      //@ts-ignore
      newText = newText.replace(key.toLowerCase(), changeObj[key].toLowerCase())
    }
  })
  return newText
}

export const fixPluralization = (text: string) => {
  return changeText(text, pluralization)
}
export const fixMovieName = (text: string) => {
  return changeText(text, tvShowName)
}

export const findFirstMovieWithRecommendation = async (
    foundMovies: MovieDB.Responses.Search.Movies,
    foundMoviesIndex: number | undefined
  ) => {
    let recommendations: MovieDB.Responses.Movie.GetRecommendations | null = {
      page: 1,
      total_pages: 1,
      total_results: 0,
      results: []
    }
    let foundMoviesIndexFirst = foundMoviesIndex
    for (let i = foundMoviesIndex ?? 0; i < foundMovies.results.length; i++) {
      recommendations = await recommendMovies(foundMovies?.results[i].id)
      foundMoviesIndexFirst = i
      console.log('new recommendation fetch', recommendations?.total_pages)
      if (recommendations?.total_pages) break
    }
    return {recommendations, foundMoviesIndexFirst}
  }