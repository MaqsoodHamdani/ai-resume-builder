import type { ResumeContent } from "./types";

export function emptyContent(name = "", email = ""): ResumeContent {
  return {
    contact: { fullName: name, title: "", email, phone: "", location: "", linkedin: "", portfolio: "", website: "" },
    summary: "",
    experience: [],
    education: [],
    skills: [],
    certifications: [],
    projects: [],
    languages: [],
    awards: [],
    volunteer: [],
  };
}
