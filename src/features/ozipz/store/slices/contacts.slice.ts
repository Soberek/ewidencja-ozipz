import { OzipzDbService } from "../../../../db/client";
import { syncCoordinatorContact, unlinkCoordinatorContact } from "../../utils/participationUtils";
import type { ContactsSlice, SliceCreator } from "./types";

export const createContactsSlice: SliceCreator<ContactsSlice> = (set) => ({
  contacts: [],

  addContact: async (contact) => {
    const created = await OzipzDbService.addContact(contact);
    set((state) => ({ contacts: [...state.contacts, created] }));
    return created;
  },

  updateContact: async (id, updates) => {
    await OzipzDbService.updateContact(id, updates);
    set((state) => {
      const contacts = state.contacts.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      );
      const updated = contacts.find((c) => c.id === id);
      return {
        contacts,
        participations: updated ? syncCoordinatorContact(state.participations, updated) : state.participations,
      };
    });
  },

  deleteContact: async (id) => {
    await OzipzDbService.deleteContact(id);
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== id),
      participations: unlinkCoordinatorContact(state.participations, id),
    }));
  },
});
