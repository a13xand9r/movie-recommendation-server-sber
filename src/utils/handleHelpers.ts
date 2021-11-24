import { Card, SaluteRequest, SaluteResponse } from '@salutejs/scenario'
import MovieDB from 'node-themoviedb'
import { getGenres, recommendMovies } from '../movieApi'
import { findFirstMovieWithRecommendation, fixMovieName, getRandomFromArray } from './utils'

export const findGenres = (genres: MovieDB.Responses.Genre.Common, genreIds: number[]) => {
    return genres.genres.filter(genre => {
        let flag = false
        genreIds.forEach(id => {
            if (id === genre.id) flag = true
        })
        return flag
    }).map(genre => genre.name)
}

export const sendNewMovie = async (
    req: SaluteRequest,
    res: SaluteResponse,
    movie: MovieDB.Objects.Movie,
    genres: MovieDB.Responses.Genre.Common,
    initialPhrase: string = ''
) => {
    if (initialPhrase) {
        res.appendSuggestions(['Назвать другой фильм', 'Ещё', 'Не тот фильм'])
    } else {
        res.appendSuggestions(['Назвать другой фильм', 'Ещё', 'Сколько всего рекомендаций?'])
    }
    let recommendationText: string[] = []
    if (req.request.payload.character.appeal === 'official') {
        recommendationText = ['Рекомендую', 'Могу порекомендовать', 'Можете посмотреть']
        res.setPronounceText(`${initialPhrase}${getRandomFromArray(recommendationText)} ${fixMovieName(movie.title)}. ${movie.overview}. Скажите \"ещё\", чтобы посмотреть другую рекомендацию.`)
    } else {
        recommendationText = ['Рекомендую', 'Могу порекомендовать', 'Можешь посмотреть']
        res.setPronounceText(`${initialPhrase}${getRandomFromArray(recommendationText)} ${fixMovieName(movie.title)}. ${movie.overview}. Скажи \"ещё\", чтобы посмотреть другую рекомендацию.`)
    }
    const movieGenres = findGenres(genres, movie.genre_ids)
    res.appendCommand({
        type: 'SET_MOVIE',
        movie: {
            name: fixMovieName(movie.title),
            img: `https://www.themoviedb.org/t/p/w600_and_h900_bestv2/${movie.poster_path}`,
            description: movie.overview,
            year: new Date(movie.release_date).getFullYear(),
            rate: movie.vote_average,
            genres: movieGenres
        }
    })
}
export const sendFoundTVShow = async (
    req: SaluteRequest,
    res: SaluteResponse,
    movie: MovieDB.Objects.Movie,
    genres: MovieDB.Responses.Genre.Common
) => {
    res.appendSuggestions(['Да', 'Нет'])
    if (req.request.payload.character.appeal === 'official') {
        res.setPronounceText(`Вы имели ввиду фильм ${movie.title}?`)
    } else {
        res.setPronounceText(`Ты имел ввиду фильм ${movie.title}?`)
    }
    const movieGenres = findGenres(genres, movie.genre_ids)
    res.appendCommand({
        type: 'SET_MOVIE',
        movie: {
            name: movie.title,
            img: `https://www.themoviedb.org/t/p/w600_and_h900_bestv2/${movie.poster_path}`,
            description: movie.overview,
            year: new Date(movie.release_date).getFullYear(),
            rate: movie.vote_average,
            genres: movieGenres
        }
    })
}

// export const createMovieCard = (movie: MovieDB.Objects.TVShow): Card => ({
//   type: 'gallery_card',
//   items: [{
//     type: 'media_gallery_item',
//     image: {
//       url: `https://www.themoviedb.org/t/p/w600_and_h900_bestv2/${movie.poster_path}`,
//       size: {
//         width: 'medium',
//         aspect_ratio: 1.5
//       }
//     },
//     margins: {
//       top: '5x',
//       left: '5x',
//       bottom: '5x',
//       right: '5x',
//     },
//     top_text: {
//       text: fixMovieName(movie.name),
//       typeface: 'title1',
//       text_color: 'default',
//       max_lines: 2
//     },
//     bottom_text: {
//       text: movie.overview,
//       typeface: 'footnote1',
//       text_color: 'secondary',
//       max_lines: 10
//     },
//   }]
// })

export const sendFirstRecommendation = async (
    foundMovies: MovieDB.Responses.Search.Movies,
    foundMoviesIndex: number | undefined,
    session: Record<string, unknown>,
    req: SaluteRequest,
    res: SaluteResponse,
    dispatch: ((path: string[]) => void) | undefined
) => {
    const { recommendations, foundMoviesIndexFirst } = await findFirstMovieWithRecommendation(foundMovies, foundMoviesIndex)
    console.log('foundMoviesIndexFirst', foundMoviesIndexFirst)
    session.foundMoviesIndex = foundMoviesIndexFirst
    console.log('Number(session.foundMoviesIndex)', Number(session.foundMoviesIndex))
    // console.log(recommendations?.results.map(item => item.title).join(', '))
    const genres = await getGenres()
    if (recommendations && recommendations?.results?.length > 0) {
        session.genres = genres
        session.foundTVShow = foundMovies
        session.recommendations = recommendations
        session.currentItem = 1
        session.userMovie = req.message.original_text
        res.setAutoListening(true)
        sendNewMovie(
            req,
            res,
            recommendations.results[0],
            genres as MovieDB.Responses.Genre.Common,
            `Рекомендации для фильма ${foundMovies.results[Number(session.foundMoviesIndex) ?? 0].title} `
        )
    } else {
        session.recommendations = null
        res.appendBubble(`К сожалению, у меня нет рекомендаций для фильма ${foundMovies.results[foundMoviesIndex ?? 0].title}. Может это не тот фильм? Или попробуем найти другой фильм?`)
        res.setPronounceText(`К сожалению, у меня нет рекомендаций для фильма ${foundMovies.results[foundMoviesIndex ?? 0].title}. Может это не тот фильм? Или попробуем найти другой фильм?`)
        res.appendSuggestions(['Не тот фильм', 'Назвать другой фильм'])
        // res.setPronounceText('К сожалению, у меня нет рекомендаций для этого фильма. Может попробуем другой фильм?')
        // dispatch && dispatch(['searchMovie'])
    }
}