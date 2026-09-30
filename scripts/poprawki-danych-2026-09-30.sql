-- Jednorazowe poprawki danych po przejściu na słowniki jako jedyne źródło prawdy (2026-09-30).
-- Uruchamiać przy zamkniętej aplikacji, po zrobieniu kopii bazy:
--   sqlite3 "$HOME/Documents/Ewidencja OZiPZ/ozipz.db" < scripts/poprawki-danych-2026-09-30.sql
-- Działania z zamkniętych miesięcy nie są zmieniane.
PRAGMA foreign_keys = ON;
BEGIN IMMEDIATE;
-- 1. Obszar GIS dla nowych symboli (jak pokrewne 966.15 Seniorzy i 966.16 Zdrowie psychiczne)
UPDATE ozipz_dictionaries SET gis_category = 'inne', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
 WHERE dict_type = 'jrwaSymbol' AND code IN ('966.19','966.20') AND gis_category IS NULL;
-- 2. Stanowisko kontaktów zgodne ze słownikiem
UPDATE ozipz_contacts SET position = (SELECT label FROM ozipz_dictionaries WHERE dict_type='contactPosition' AND code='koordynator_szkolny'), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
 WHERE position = 'Szkolny Koordynator Programów Edukacyjnych';
-- 3. Brakujące typy materiałów w słowniku
INSERT OR IGNORE INTO ozipz_dictionaries (id, dict_type, code, label, is_system, created_at, updated_at) VALUES
 ('dict_material_poradnik', 'materialType', 'poradnik', 'poradnik', 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now')),
 ('dict_material_pakiet_programowy', 'materialType', 'pakiet_programowy', 'pakiet programowy', 0, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'));
-- 4. Kampanie w działaniach: nazwa → kod słownika (tylko otwarte miesiące)
UPDATE ozipz_actions SET campaign_id = (SELECT d.code FROM ozipz_dictionaries d WHERE d.dict_type='campaign' AND d.label = ozipz_actions.campaign_id), updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
 WHERE EXISTS (SELECT 1 FROM ozipz_dictionaries d WHERE d.dict_type='campaign' AND d.label = ozipz_actions.campaign_id)
   AND NOT EXISTS (SELECT 1 FROM ozipz_closed_months WHERE month_key = substr(ozipz_actions.date, 1, 7));
-- 5. 966.15 to akcja nieprogramowa; program „Senior w roli głównej” to 966.19 (tak są oznaczone jego działania)
UPDATE ozipz_dictionaries SET kind = 'NIEPROGRAMOWE', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
 WHERE dict_type = 'jrwaSymbol' AND code = '966.15';
UPDATE ozipz_programs SET jrwa_symbol = '966.19', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
 WHERE id = 'seniorzy' AND jrwa_symbol = '966.15';
COMMIT;
SELECT 'gis', code, gis_category FROM ozipz_dictionaries WHERE code IN ('966.19','966.20');
SELECT 'pos', position, count(*) FROM ozipz_contacts GROUP BY 2;
SELECT 'mat', count(*) FROM ozipz_materials WHERE material_type NOT IN (SELECT code FROM ozipz_dictionaries WHERE dict_type='materialType');
SELECT 'camp', campaign_id, substr(date,1,7), count(*) FROM ozipz_actions WHERE coalesce(campaign_id,'')<>'' GROUP BY 2,3;
SELECT 'kind', code, kind FROM ozipz_dictionaries WHERE code IN ('966.15','966.19');
SELECT 'prog', id, jrwa_symbol FROM ozipz_programs WHERE id = 'seniorzy';
PRAGMA integrity_check;
PRAGMA foreign_key_check;
