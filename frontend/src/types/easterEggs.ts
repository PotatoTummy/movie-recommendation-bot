export interface EasterEgg {
  id: string;
  title: string;
  movie: string;
  year: number;
  icon: string;
  hint: string;
  description: string;
  triggerKey: string[];
}

export const EASTER_EGGS: EasterEgg[] = [
  {
    id: "matrix",
    title: "The Construct",
    movie: "The Matrix",
    year: 1999,
    icon: "🕶️",
    hint: "Follow the white rabbit or type the name of the simulation...",
    description: "Cascading digital katakana rain with cybernetic terminal styling.",
    triggerKey: ["matrix", "neo"],
  },
  {
    id: "interstellar",
    title: "Gargantua Wormhole",
    movie: "Interstellar",
    year: 2014,
    icon: "🪐",
    hint: "What was Cooper's final plea to Murph through the bookcase?",
    description: "Deep space gravitational lensing, starfield warp particles, and celestial ambiance.",
    triggerKey: ["stay", "cooper"],
  },
  {
    id: "fightclub",
    title: "Project Mayhem",
    movie: "Fight Club",
    year: 1999,
    icon: "🧼",
    hint: "The first rule of the club is that you do not talk about it...",
    description: "Subliminal frame flashes, vintage 35mm film burn splice, and the iconic pink soap.",
    triggerKey: ["tyler", "soap"],
  },
  {
    id: "starwars",
    title: "The Opening Crawl",
    movie: "Star Wars",
    year: 1977,
    icon: "⚔️",
    hint: "May the ___ be with you, or type the ancient knight order...",
    description: "Classic 3D perspective yellow space crawl tilting into deep starfield.",
    triggerKey: ["jedi", "force"],
  },
  {
    id: "godfather",
    title: "The Family Business",
    movie: "The Godfather",
    year: 1972,
    icon: "🌹",
    hint: "Name of the legendary Don who made an offer you couldn't refuse...",
    description: "1940s vintage sepia noir atmosphere with flickering film grain and rose accents.",
    triggerKey: ["corleone", "godfather"],
  },
];
