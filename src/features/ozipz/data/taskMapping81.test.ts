import { describe, it, expect } from 'vitest';
import { MIGRATED_FIREBASE_DATA } from '../../../test/fixtures/migratedData';

describe('Task Mapping to 81/2026 Verification', () => {
  it('contains all 240 mapped actions from better-oz-851 to better-oz-1090', () => {
    const actionsMap = new Map(MIGRATED_FIREBASE_DATA.actions.map(a => [a.id, a]));
    for (let i = 851; i <= 1090; i++) {
      const id = `better-oz-${i}`;
      expect(actionsMap.has(id), `Action ${id} should exist in migrated data`).toBe(true);
    }
  });

  it('correctly maps better-oz-851 to Smolnica (loc-56) with dot. 1/2026', () => {
    const a = MIGRATED_FIREBASE_DATA.actions.find(act => act.id === 'better-oz-851');
    expect(a).toBeDefined();
    expect(a?.facilityId).toBe('loc-56');
    expect(a?.facilityName).toBe('Szkoła Podstawowa nr 1 im. Młodych Talentów w Smolnicy');
    expect(a?.municipality).toBe('Dębno');
    expect(a?.izrzSign).toBe('dot. 1/2026');
    expect(a?.date).toBe('2026-01-13');
    expect(a?.programId).toBe('bezpieczne-ferie');
  });

  it('correctly maps better-oz-852 to Smolnica with 3/2026 and Higiena naszą tarczą ochronną', () => {
    const a = MIGRATED_FIREBASE_DATA.actions.find(act => act.id === 'better-oz-852');
    expect(a).toBeDefined();
    expect(a?.facilityId).toBe('loc-56');
    expect(a?.facilityName).toBe('Szkoła Podstawowa nr 1 im. Młodych Talentów w Smolnicy');
    expect(a?.municipality).toBe('Dębno');
    expect(a?.izrzSign).toBe('3/2026');
    expect(a?.actionType).toBe('Prelekcja (warsztat)');
    expect(a?.programId).toBe('higiena-tarcza');
    expect(a?.participantsCount).toBe(46);
    expect(a?.numberOfActions).toBe(2);
  });

  it('correctly maps better-oz-1090 (dot. 81/2026 period) with Bezpieczne Wakacje', () => {
    const a = MIGRATED_FIREBASE_DATA.actions.find(act => act.id === 'better-oz-1090');
    expect(a).toBeDefined();
    expect(a?.date).toBe('2026-07-18');
    expect(a?.programId).toBe('bezpieczne-wakacje');
    expect(a?.campaignName).toBe('Bezpieczne Wakacje');
  });

  it('ensures all schedule tasks have valid month and year populated', () => {
    for (const s of MIGRATED_FIREBASE_DATA.schedules) {
      if (s.eventDate) {
        expect(s.month).toBeGreaterThanOrEqual(1);
        expect(s.month).toBeLessThanOrEqual(12);
        expect(s.year).toBeGreaterThanOrEqual(2025);
      }
    }
  });
});
