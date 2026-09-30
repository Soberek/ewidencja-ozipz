import { beforeEach } from "vitest";
import { useOzipzDbStore } from "../features/ozipz/store/useOzipzDbStore";
import { JRWA_DICTIONARY_FIXTURE } from "./fixtures/jrwaCatalog";

// Aplikacja nie ma wbudowanego słownika JRWA – czyta go z bazy. Testy startują z bazą (tu: pamięcią
// przeglądarki trybu awaryjnego) i magazynem, w których ten słownik już jest; test może go nadpisać.
const loadDictionary = () => {
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem("ozipz_dictionaries") === null) {
      localStorage.setItem("ozipz_dictionaries", JSON.stringify(JRWA_DICTIONARY_FIXTURE));
    }
  } catch {
    // Test celowo blokuje pamięć przeglądarki.
  }
  useOzipzDbStore.setState({ dictionaryItems: JRWA_DICTIONARY_FIXTURE });
};
loadDictionary();
beforeEach(loadDictionary);
