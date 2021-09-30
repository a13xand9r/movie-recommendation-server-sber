import { createIntents, createMatchers, createUserScenario, SaluteHandler, SaluteRequest } from '@salutejs/scenario';
import MovieDB from 'node-themoviedb';
import model from './intents.json'
import { recommendMovies, getGenres, findMovie } from './movieApi';
import { moviesSuggestions } from './utils/constants';
import { sendFirstRecommendation, sendNewMovie } from './utils/handleHelpers';
import { fixPluralization, getRandomFromArray } from './utils/utils';
require('dotenv').config()
export const intents = createIntents(model.intents)
const { action, regexp, intent, text } = createMatchers<SaluteRequest , typeof intents>();

export const newMovieHandler: SaluteHandler = async ({req, res, session}, dispatch) => {
  let {foundMovies, foundMoviesIndex} = session as {
    foundMovies: MovieDB.Responses.Search.Movies | null | undefined
    foundMoviesIndex: number | undefined
  }
  if(req.message.original_text.toLocaleLowerCase().includes('что ты умеешь')){
    console.log('что ты умеешь')
    dispatch && dispatch(['help'])
  } else {
    if (!foundMovies){
      foundMovies = await findMovie(req.message.original_text)
      session.foundMoviesIndex = 0
      session.foundMovies = foundMovies
    }
    if (!foundMovies || foundMovies.total_results === 0) {
      res.setPronounceText('К сожалению, я не знаю таких фильмов. Может попробуем другой фильм?')
      res.appendBubble('К сожалению, я не знаю таких фильмов. Может попробуем другой фильм?')
      dispatch && dispatch(['searchMovie'])
    } else {
      if (foundMovies?.results[foundMoviesIndex ?? 0]){
        await sendFirstRecommendation(foundMovies, foundMoviesIndex, session, req, res, dispatch)
      } else {
        res.setPronounceText('У меня больше нет фильмов по этому запросу.')
      }
    }
  }
}

export const goToNewMovieHandler: SaluteHandler = ({req, res, session}, dispatch) => {
  if (req.request.payload.character.appeal === 'official'){
    res.setPronounceText('Какой фильм вам нравится?')
    res.appendBubble('Какой фильм вам нравится?')
  } else {
    res.setPronounceText('Какой фильм тебе нравится?')
    res.appendBubble('Какой фильм тебе нравится?')
  }
  dispatch && dispatch(['searchMovie'])
}

export const howManyRecommendationsHandler: SaluteHandler = ({res, session}) => {
  const { recommendations, userMovie } = session as { recommendations: MovieDB.Responses.TV.GetRecommendations, userMovie: string }
  res.setPronounceText(fixPluralization(`Всего ${recommendations.results.length} рекомендаций.`))
  res.appendSuggestions(['Найти другой фильм', 'Ещё'])
}

export const userScenario = createUserScenario({
  searchMovie: {
    match: () => false,
    handle: ({res, session}) => {
      session.foundMoviesIndex = 0
      session.foundMovies = null
      res.appendSuggestions([getRandomFromArray(moviesSuggestions)])
      res.setAutoListening(true)
    },
    children: {
      movieName: {
        match: (req) => !!req.message.original_text,
        handle: newMovieHandler,
        children: {
          howManyRecommendations: {
            match: intent('/Сколько рекомендаций', {confidence: 0.2}),
            handle: howManyRecommendationsHandler
          },
        }
      }
    }
  },
  otherMovie: {
    match: intent('/Не тот фильм', {confidence: 0.5}),
    handle: async ({req, res, session}, dispatch) => {
      session.foundMoviesIndex = Number(session.foundMoviesIndex) + 1
      let {foundMovies, foundMoviesIndex} = session as {
        foundMovies: MovieDB.Responses.Search.Movies | null | undefined
        foundMoviesIndex: number
      }
      if (foundMovies?.results[foundMoviesIndex ?? 0]){
        await sendFirstRecommendation(foundMovies, foundMoviesIndex, session, req, res, dispatch)
      } else {
        res.setPronounceText('У меня больше нет фильмов по этому запросу. Можем найти другой фильм')
        // res.appendSuggestions(['Найти другой фильм'])
        dispatch && dispatch(['searchMovie'])
      }
    }
  },
  getGenres: {
    match: () => false,
    handle: async ({session}, dispatch) => {
      session.genres = await getGenres()
      dispatch && dispatch(['searchMovie'])
    }
  },
  newMovie: {
    match: intent('/Найти фильм', {confidence: 0.2}),
    handle: goToNewMovieHandler
  },
  help: {
    match: intent('/Помощь', {confidence: 0.2}),
    handle: ({req, res}) => {
      if (req.request.payload.character.appeal === 'official') {
        res.setPronounceText(`Я могу порекомендовать фильм на основе ваших предпочтений. Можете сказать \"Порекомендуй фильм\", чтобы посмотреть рекомендации. Дальше можете сказать \"Не тот фильм\", если это не тот что вы искали или скажите \"Ещё\" для следующей рекомендации. Также можно узнать сколько всего рекомендаций сказав соответствующую фразу.`)
      } else {
        res.setPronounceText(`Я могу порекомендовать фильм на основе твоих предпочтений. Можешь сказать \"Порекомендуй фильм\", чтобы посмотреть рекомендации. Дальше можешь сказать \"Не тот фильм\", если это не тот что ты искал или скажи \"Ещё\" для следующей рекомендации. Также можно узнать сколько всего рекомендаций сказав соответствующую фразу.`)
      }
      res.appendSuggestions(['Порекомендуй фильм'])
    }
  },
  nextRecommendation: {
    match: intent('/Следующий совет', { confidence: 0.2 }),
    handle: ({ req, res, session }, dispatch) => {
      const { recommendations, currentItem, genres } = session as {
        recommendations: MovieDB.Responses.Movie.GetRecommendations | null,
        genres: MovieDB.Responses.Genre.Common,
        currentItem: number
      }

      if (recommendations && recommendations.total_results > currentItem) {
        const currentMovie = recommendations.results[currentItem]
        sendNewMovie(req, res, currentMovie, genres)
        session.currentItem = currentItem + 1
      } else {
        res.setPronounceText('У меня больше нет рекомендаций. Может попробуем другой фильм?')
        res.appendBubble('У меня больше нет рекомендаций. Может попробуем другой фильм?')
        session.recommendations = null
        dispatch && dispatch(['searchMovie'])
      }
      res.setAutoListening(true)
    },
    children: {
      howManyRecommendations: {
        match: intent('/Сколько рекомендаций', {confidence: 0.2}),
        handle: howManyRecommendationsHandler
      },
      yes: {
        match: intent('/Да', { confidence: 0.2 }),
        handle: goToNewMovieHandler
      },
      no: {
        match: intent('/Нет', { confidence: 0.2 }),
        handle: ({res}) => {
          res.setPronounceText('Тогда до новых встреч.')
          res.appendBubble('Тогда до новых встреч.')
          res.finish()
        }
      }
    }
  }
})