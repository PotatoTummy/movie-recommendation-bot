export interface EasterEggMatch {
  key: string;
  id: "matrix" | "interstellar" | "fight" | "godfather" | "starwars";
  name: string;
}

export const EASTER_EGG_TRIGGERS: EasterEggMatch[] = [
  { key: "there is no spoon", id: "matrix", name: "The Matrix" },
  { key: "stay", id: "interstellar", name: "Interstellar" },
  { key: "first rule", id: "fight", name: "Fight Club" },
  { key: "an offer he can't refuse", id: "godfather", name: "The Godfather" },
  { key: "offer he can't refuse", id: "godfather", name: "The Godfather" },
  { key: "offer he cannot refuse", id: "godfather", name: "The Godfather" },
  { key: "i am your father", id: "starwars", name: "Star Wars" },
];
