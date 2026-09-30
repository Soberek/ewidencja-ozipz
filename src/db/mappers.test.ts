import { describe, it, expect } from "vitest";
import { Mappers } from "./mappers";
import type { ActionSqlRow, MaterialSqlRow } from "./types";

describe("Mappers", () => {
  it("correctly maps ActionSqlRow to OzipzAction", () => {
    const row: ActionSqlRow = {
      id: "act-1",
      title: "Prelekcja o tytoniu",
      action_type: "prelekcja",
      date: "2026-03-15",
      facility_id: "fac-1",
      facility_name: "SP 1 Barlinek",
      municipality: "Barlinek",
      program_id: null,
      program_name: null,
      topic: "tyton",
      audience_group: "uczniowie_sp",
      participants_count: 45,
      indirect_recipients_count: 10,
      materials_distributed_count: 45,
      lead_educator: "Sekcja OZiPZ",
      notes: "Bardzo aktywna dyskusja",
      created_at: "2026-03-15T10:00:00.000Z",
      updated_at: "2026-03-15T10:00:00.000Z",
    };

    const entity = Mappers.toAction(row);
    expect(entity.id).toBe("act-1");
    expect(entity.title).toBe("Prelekcja o tytoniu");
    expect(entity.participantsCount).toBe(45);
    expect(entity.notes).toBe("Bardzo aktywna dyskusja");
  });

  it("correctly maps MaterialSqlRow to OzipzMaterial", () => {
    const row: MaterialSqlRow = {
      id: "mat-1",
      title: "Broszura Bieg po Zdrowie",
      material_type: "broszura",
      topic: "tyton",
      publisher: "GIS / WSSE Szczecin",
      target_audience: "Młodzież",
      notes: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };

    const entity = Mappers.toMaterial(row);
    expect(entity.materialType).toBe("broszura");
    expect(entity.publisher).toBe("GIS / WSSE Szczecin");
    expect(entity.targetAudience).toBe("Młodzież");
  });

  it("correctly maps DistributionSqlRow to OzipzDistribution with action_id and action_title", () => {
    const row = {
      id: "dist-1",
      material_id: "mat-1",
      material_title: "Ulotka Profilaktyczna",
      material_type: "ulotka",
      facility_id: "fac-1",
      recipient_name: "SP 1 Myślibórz",
      municipality: "Myślibórz",
      action_id: "act-999",
      action_title: "Prelekcja o tytoniu",
      quantity: 50,
      distribution_date: "2026-03-15",
      assigned_educator: "Krzysztof Palpuchowski",
      purpose: "Działania profilaktyczne",
      notes: "Karta rozdzielnika",
      created_at: "2026-03-15T10:00:00.000Z",
      updated_at: null,
    };

    const entity = Mappers.toDistribution(row);
    expect(entity.id).toBe("dist-1");
    expect(entity.actionId).toBe("act-999");
    expect(entity.actionTitle).toBe("Prelekcja o tytoniu");
    expect(entity.quantity).toBe(50);
    expect(entity.assignedEducator).toBe("Krzysztof Palpuchowski");
  });

  it("correctly maps ProgramSqlRow to OzipzProgram", () => {
    const row = {
      id: "trzymaj-forme",
      code: "TRZYMAJ-FORME",
      name: "Trzymaj Formę",
      edition_year: "2025/2026",
      jrwa_symbol: "966.1",
      target_audience: "Uczniowie klas V-VIII",
      description: "Ogólnopolski program edukacyjny",
      status: "aktywny",
      participating_schools_count: 12,
      total_pupils_reached: 1200,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toProgram(row);
    expect(entity.id).toBe("trzymaj-forme");
    expect(entity.jrwaSymbol).toBe("966.1");
    expect(entity.participatingSchoolsCount).toBe(12);
  });

  it("correctly maps ParticipationSqlRow to OzipzSchoolParticipation", () => {
    const row = {
      id: "part-1",
      program_id: "trzymaj-forme",
      program_name: "Trzymaj Formę",
      facility_id: "fac-1",
      facility_name: "SP 1 Myślibórz",
      municipality: "Myślibórz",
      school_year: "2025/2026",
      school_coordinator_name: "Anna Nowak",
      school_coordinator_contact: "anna@sp1.pl",
      school_coordinator_contact_id: "cnt-1",
      second_coordinator_name: "Jan Kowal",
      second_coordinator_contact: "600 100 200",
      second_coordinator_contact_id: null,
      pupils_count: 75,
      has_declaration: 1,
      has_final_report: 0,
      evaluation_grade: "bardzo dobra",
      notes: "Zgłoszenie terminowe",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toParticipation(row);
    expect(entity.hasDeclaration).toBe(true);
    expect(entity.hasFinalReport).toBe(false);
    expect(entity.pupilsCount).toBe(75);
    expect(entity.schoolCoordinatorContactId).toBe("cnt-1");
    expect(entity.secondCoordinatorName).toBe("Jan Kowal");
    expect(entity.secondCoordinatorContactId).toBeUndefined();
    expect(Mappers.toParticipation({ ...row, school_coordinator_contact_id: null }).schoolCoordinatorContactId).toBeUndefined();
  });

  it("correctly maps ScheduleSqlRow to OzipzScheduleEvent with full relational metadata", () => {
    const row = {
      id: "sch-1",
      title: "Warsztaty profilaktyczne",
      activity_type_code: "warsztaty",
      activity_type_name: "Warsztaty",
      event_date: "2026-05-10",
      end_date: "2026-05-10",
      category: "warsztaty",
      topic: "tyton",
      program_id: "trzymaj-forme",
      program_name: "Trzymaj Formę",
      campaign_id: "swiatowy-dzien-bez-tytoniu",
      campaign_name: "Światowy Dzień bez Tytoniu",
      recipient_group: "uczniowie_sp",
      location: "SP Barlinek",
      facility_id: "fac-2",
      action_id: "act-1",
      status: "zaplanowane",
      annotation_reason_code: "plan_roczny",
      annotation_reason_label: "Plan Roczny",
      responsible_person: "Krzysztof Palpuchowski",
      month: 5,
      month_name: "Maj",
      year: 2026,
      notes: "Uwagi do warsztatów",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toSchedule(row);
    expect(entity.title).toBe("Warsztaty profilaktyczne");
    expect(entity.facilityId).toBe("fac-2");
    expect(entity.programId).toBe("trzymaj-forme");
    expect(entity.programName).toBe("Trzymaj Formę");
    expect(entity.actionId).toBe("act-1");
    expect(entity.topic).toBe("tyton");
    expect(entity.month).toBe(5);
    expect(entity.year).toBe(2026);
    expect(entity.status).toBe("zaplanowane");
  });

  it("correctly maps JrwaSqlRow to OzipzJrwaCase", () => {
    const row = {
      id: "jrw-1",
      section: "OZ",
      jrwa_symbol: "0442",
      case_number: 1,
      year: 2026,
      referent_initials: "KP",
      full_case_sign: "OZiPZ.0442.1.2026",
      title: "Sprawozdanie okresowe",
      facility_id: null,
      facility_name: null,
      program_id: null,
      program_name: null,
      action_id: null,
      archival_category: "B5",
      start_date: "2026-01-10",
      end_date: null,
      initiating_document: null,
      status: "w_toku",
      assigned_educator: "Sekcja OZiPZ",
      notes: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toJrwa(row);
    expect(entity.fullCaseSign).toBe("OZiPZ.0442.1.2026");
    expect(entity.jrwaSymbol).toBe("0442");
    expect(entity.year).toBe(2026);
  });

  it("correctly maps FacilitySqlRow to OzipzFacility", () => {
    const row = {
      id: "fac-1",
      name: "Szkoła Podstawowa nr 2",
      type: "szkola_podstawowa",
      address: "ul. Szkolna 5",
      city: "Myślibórz",
      postal_code: "74-300",
      municipality: "Myślibórz",
      county: "myśliborski",
      leading_authority: "Gmina Myślibórz",
      is_complex: 0,
      parent_facility_id: null,
      default_coordinator_name: "Jan Kowalski",
      default_coordinator_phone: "500600700",
      default_coordinator_email: "jan@sp2.pl",
      notes: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toFacility(row);
    expect(entity.name).toBe("Szkoła Podstawowa nr 2");
    expect(entity.postalCode).toBe("74-300");
    expect(entity.isComplex).toBe(false);
    expect(entity.educationTypes).toEqual([]);
  });

  it("correctly maps FacilitySqlRow with JSON education_types", () => {
    const row = {
      id: "fac-2",
      name: "Szkoła Podstawowa nr 1",
      type: "szkola",
      education_types: JSON.stringify(["Szkoła podstawowa", "Oddział przedszkolny"]),
      address: "ul. Piłsudskiego 1",
      city: "Myślibórz",
      postal_code: "74-300",
      municipality: "Myślibórz",
      county: "myśliborski",
      leading_authority: "Gmina Myślibórz",
      is_complex: 0,
      parent_facility_id: null,
      default_coordinator_name: null,
      default_coordinator_phone: null,
      default_coordinator_email: null,
      notes: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toFacility(row);
    expect(entity.educationTypes).toEqual(["Szkoła podstawowa", "Oddział przedszkolny"]);
  });

  it("correctly maps DictionarySqlRow to OzipzDictionaryItem including postal_code and kind", () => {
    const row = {
      id: "dict-1",
      dict_type: "municipality",
      code: "mysliborz",
      label: "Myślibórz",
      description: "Gmina miejsko-wiejska Myślibórz",
      postal_code: "74-300",
      kind: null,
      is_system: 1,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toDictionary(row);
    expect(entity.code).toBe("mysliborz");
    expect(entity.postalCode).toBe("74-300");
    expect(entity.kind).toBeUndefined();
    expect(entity.isSystem).toBe(true);

    const jrwaRow = {
      id: "dict-jrwa-1",
      dict_type: "jrwaSymbol",
      code: "966.1",
      label: "Trzymaj Formę",
      description: null,
      kind: "PROGRAMOWE",
      gis_category: "otylosc",
      is_system: 1,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const jrwaEntity = Mappers.toDictionary(jrwaRow);
    expect(jrwaEntity.kind).toBe("PROGRAMOWE");
    expect(jrwaEntity.gisCategory).toBe("otylosc");
    expect(Mappers.toDictionary({ ...jrwaRow, gis_category: "nieznana" }).gisCategory).toBeUndefined();
  });

  it("correctly maps LetterSqlRow to OzipzLetter", () => {
    const row = {
      id: "let-1",
      direction: "wychodzace",
      letter_number: "OZ.0442.5.2026",
      letter_date: "2026-03-01",
      case_sign: "OZiPZ.0442.1.2026",
      sender_recipient: "WSSE Szczecin",
      facility_id: null,
      subject: "Przesłanie sprawozdania",
      program_id: null,
      assigned_person: "Krzysztof Palpuchowski",
      status: "wyslane",
      notes: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toLetter(row);
    expect(entity.direction).toBe("wychodzace");
    expect(entity.letterNumber).toBe("OZ.0442.5.2026");
  });

  it("correctly maps ScanSqlRow to OzipzScan", () => {
    const row = {
      id: "scan-1",
      title: "Deklaracja SP1",
      document_type: "deklaracja",
      facility_id: "fac-1",
      facility_name: "SP1 Myślibórz",
      program_id: "trzymaj-forme",
      program_name: "Trzymaj Formę",
      scan_date: "2026-02-01",
      file_size_kb: 350,
      file_name: "deklaracja_sp1.pdf",
      file_path: "/scans/deklaracja_sp1.pdf",
      notes: null,
      created_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toScan(row);
    expect(entity.title).toBe("Deklaracja SP1");
    expect(entity.fileSizeKb).toBe(350);
  });

  it("correctly maps TemplateSqlRow to OzipzTemplate", () => {
    const row = {
      id: "tpl-1",
      title: "Szablon zajęć tytoniowych",
      topic: "tyton",
      action_type: "prelekcja",
      description_template: "Przeprowadzono pogadankę z użyciem alkogogli i smokelyzera.",
      default_audience: "uczniowie_sp",
      suggested_materials: "Broszura Bieg po Zdrowie",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toTemplate(row);
    expect(entity.title).toBe("Szablon zajęć tytoniowych");
    expect(entity.actionType).toBe("prelekcja");
    expect(entity.actionDefaults).toBeUndefined();
    expect(Mappers.toTemplate({ ...row, default_audience: "" }).defaultAudience).toBe("");
  });

  it("correctly parses valid and malformed action_defaults in TemplateSqlRow", () => {
    const validRow = {
      id: "tpl-valid",
      title: "Szablon z danymi",
      topic: "inne",
      action_type: "prelekcja",
      description_template: "Opis",
      default_audience: "uczniowie_sp",
      suggested_materials: null,
      action_defaults: JSON.stringify({ title: "Higiena rąk", leadEducator: "Anna", campaignId: "Kampania" }),
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const validEntity = Mappers.toTemplate(validRow);
    expect(validEntity.actionDefaults).toEqual({ title: "Higiena rąk", leadEducator: "Anna", campaignId: "Kampania" });

    const malformedRow = {
      id: "tpl-malformed",
      title: "Szablon z błędnym JSON",
      topic: "inne",
      action_type: "prelekcja",
      description_template: "Opis",
      default_audience: "uczniowie_sp",
      suggested_materials: null,
      action_defaults: "{ invalid json string",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const malformedEntity = Mappers.toTemplate(malformedRow);
    expect(malformedEntity.actionDefaults).toBeUndefined();
  });

  it("correctly maps StaffSqlRow to OzipzStaff", () => {
    const row = {
      id: "stf-1",
      full_name: "Krzysztof Palpuchowski",
      role: "Kierownik Sekcji OZiPZ",
      email: "krzysztof@psse.gov.pl",
      phone: "500100200",
      active: 1,
      specialization: "Koordynacja programów",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toStaff(row);
    expect(entity.fullName).toBe("Krzysztof Palpuchowski");
    expect(entity.active).toBe(true);
  });

  it("correctly maps ContactSqlRow to OzipzContact", () => {
    const row = {
      id: "cnt-1",
      facility_id: "fac-1",
      facility_name: "SP1 Myślibórz",
      municipality: "Myślibórz",
      name: "Maria Wiśniewska",
      position: "Koordynator Szkolny",
      phone: "501234567",
      email: "maria@sp1.pl",
      notes: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toContact(row);
    expect(entity.name).toBe("Maria Wiśniewska");
    expect(entity.facilityName).toBe("SP1 Myślibórz");
    expect(entity.municipality).toBe("Myślibórz");
  });

  it("correctly maps RegisterSqlRow to OzipzRegisterItem", () => {
    const row = {
      id: "reg-1",
      register_type: "szkolenia",
      register_number: "1/2026",
      date: "2026-04-15",
      title: "Szkolenie koordynatorów programu Trzymaj Formę",
      organizer: "PSSE Myślibórz",
      location: "Sala konferencyjna PSSE",
      facility_id: null,
      facility_name: null,
      program_id: "trzymaj-forme",
      program_name: "Trzymaj Formę",
      jrwa_sign: "OZiPZ.9011.1.2026",
      participants_count: 24,
      target_audience: "Nauczyciele i pedagodzy",
      outcome: "Przeszkolono 24 koordynatorów",
      responsible_person: "Krzysztof Palpuchowski",
      notes: null,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    };
    const entity = Mappers.toRegister(row);
    expect(entity.title).toBe("Szkolenie koordynatorów programu Trzymaj Formę");
    expect(entity.participantsCount).toBe(24);
    expect(entity.registerType).toBe("szkolenia");
  });

  it("handles zero numerical values correctly without converting them to undefined or null", () => {
    const action = Mappers.toAction({
      id: "act-0",
      title: "Akcja z zerowymi odbiorcami",
      action_type: "prelekcja",
      date: "2026-06-01",
      facility_id: null,
      facility_name: "Miejsce",
      municipality: "Gmina",
      program_id: null,
      program_name: null,
      topic: "",
      audience_group: "młodzież",
      participants_count: 0,
      indirect_recipients_count: 0,
      materials_distributed_count: 0,
      lead_educator: "Jan",
      notes: null,
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-01T00:00:00Z",
    });
    expect(action.participantsCount).toBe(0);
    expect(action.indirectRecipientsCount).toBe(0);
    expect(action.materialsDistributedCount).toBe(0);

    const pub = Mappers.toPublication({
      id: "pub-0",
      title: "Post bez zasiegu",
      channel: "facebook",
      publication_date: "2026-06-01",
      topic: "zdrowie",
      link: null,
      reach_count: 0,
      action_id: null,
      author: "Jan",
      notes: null,
      created_at: "2026-06-01T00:00:00Z",
      updated_at: "2026-06-01T00:00:00Z",
    });
    expect(pub.reachCount).toBe(0);

    const scan = Mappers.toScan({
      id: "scan-0",
      title: "Skan pusty",
      document_type: "inny",
      facility_id: null,
      facility_name: "Placówka",
      program_id: null,
      program_name: null,
      scan_date: "2026-06-01",
      file_size_kb: 0,
      file_name: "empty.pdf",
      file_path: null,
      notes: null,
      created_at: "2026-06-01T00:00:00Z",
    });
    expect(scan.fileSizeKb).toBe(0);
  });
});
