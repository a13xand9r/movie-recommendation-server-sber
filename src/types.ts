
export type Recommendation = {
  adult: boolean
  id: number
  name: string
  origin_country: string[]
  original_name: string
  overview: string
  vote_average: number
  vote_count: number
  popularity: number
  original_language: string
  poster_path: string
  first_air_date: string
}
export type RecommendationsList = {
  results: Recommendation[]
  page: number
  total_pages: number
  total_results: number
}