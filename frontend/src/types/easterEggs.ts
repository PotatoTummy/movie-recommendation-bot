export interface EasterEgg {
  id: string;
  title: string;
  movie: string;
  year: number;
  icon: string;
  hint: string;
  riddle: string;
  description: string;
  triggerKey: string[];
  acceptedAnswers: string[];
}

export const EASTER_EGGS: EasterEgg[] = [
  {
    id: "matrix",
    title: "The Construct",
    movie: "The Matrix",
    year: 1999,
    icon: "🕶️",
    hint: "The 1999 sci-fi simulation with the red pill & blue pill.",
    riddle: "Follow the white rabbit. What is the one-word name of the reality simulation?",
    description: "Cascading digital green Katakana rain with CRT cybernetic terminal styling.",
    triggerKey: ["matrix", "neo"],
    acceptedAnswers: ["matrix", "the matrix", "neo", "white rabbit", "trinity"],
  },
  {
    id: "interstellar",
    title: "Gargantua Wormhole",
    movie: "Interstellar",
    year: 2014,
    icon: "🪐",
    hint: "Christopher Nolan's 2014 space odyssey through the wormhole.",
    riddle: "What was Cooper's frantic 4-letter Morse code plea to Murph through the bookshelf?",
    description: "Deep space gravitational lensing, orbiting starfield warp particles, and celestial ambiance.",
    triggerKey: ["stay", "cooper"],
    acceptedAnswers: ["stay", "interstellar", "cooper", "tesseract", "gargantua"],
  },
  {
    id: "fightclub",
    title: "Project Mayhem",
    movie: "Fight Club",
    year: 1999,
    icon: "🧼",
    hint: "David Fincher's 1999 cult classic. The first rule is you do not talk about it.",
    riddle: "What is Tyler's last name or the pink household item he manufactures from fat?",
    description: "Subliminal frame flashes, vintage 35mm film burn splice, and the iconic pink soap.",
    triggerKey: ["tyler", "soap"],
    acceptedAnswers: ["soap", "fight club", "tyler", "durden", "tyler durden", "mayhem"],
  },
  {
    id: "starwars",
    title: "The Opening Crawl",
    movie: "Star Wars",
    year: 1977,
    icon: "⚔️",
    hint: "George Lucas's 1977 space fantasy. Lightsabers and the Rebel Alliance.",
    riddle: "May the ___ be with you. What is the mystical energy field or the knight order?",
    description: "Classic 3D perspective yellow space crawl tilting into deep starfield.",
    triggerKey: ["jedi", "force"],
    acceptedAnswers: ["jedi", "force", "the force", "star wars", "skywalker", "lightsaber"],
  },
  {
    id: "godfather",
    title: "The Family Business",
    movie: "The Godfather",
    year: 1972,
    icon: "🌹",
    hint: "Francis Ford Coppola's 1972 crime epic. An offer he can't refuse.",
    riddle: "What is the family surname of Don Vito and Michael?",
    description: "1940s vintage sepia noir atmosphere with flickering film grain and rose accents.",
    triggerKey: ["corleone", "godfather"],
    acceptedAnswers: ["corleone", "godfather", "the godfather", "vito", "don corleone", "michael corleone"],
  },
];
