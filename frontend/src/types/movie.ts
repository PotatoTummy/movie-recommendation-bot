export interface MovieItem {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  rating: number;
  vote_count: number;
  poster_url: string | null;
}

export interface MovieDetails {
  id: number;
  title: string;
  tagline?: string;
  overview: string;
  runtime?: number;
  release_date: string;
  rating: number;
  genres: string[];
  poster_url: string | null;
  backdrop_url: string | null;
  trailer_youtube_url: string | null;
  trailer_youtube_key: string | null;
  streaming_providers: string[];
  rent_providers: string[];
}

export type MovieDataEvent =
  | {
      type: "MOVIE_RECOMMENDATIONS";
      timestamp: number;
      data: {
        genre?: string;
        movies: MovieItem[];
      };
    }
  | {
      type: "MOVIE_SEARCH_RESULTS";
      timestamp: number;
      data: {
        query: string;
        movies: MovieItem[];
      };
    }
  | {
      type: "MOVIE_DETAILS";
      timestamp: number;
      data: MovieDetails;
    };
