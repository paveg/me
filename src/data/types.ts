export type Period = { start: string; end: string | null };

export type Star = {
  situation: string;
  task: string;
  action: string;
  result: string;
};

export type Link = { url: string; label: string };

export type RoleEntry = {
  role: string;
  period: Period;
  project?: string;
  description: string;
  highlights?: string[];
  technologies?: string[];
  links?: Link[];
  star?: Star[];
};

export type WorkExperience = {
  company: string;
  role: string;
  period: Period;
  description: string;
  highlights?: string[];
  technologies?: string[];
  star?: Star[];
  roles?: RoleEntry[];
};

export type Project = {
  name: string;
  type: 'work' | 'personal' | 'oss';
  period: Period;
  description: string;
  role?: string;
  techStack: string[];
  outcomes?: string[];
  url?: string;
  repository?: string;
};

export type Skill = {
  category: string;
  items: {
    name: string;
    level?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    yearsOfExperience?: number;
  }[];
};

export type Certification = {
  name: string;
  issuer: string;
  date: string;
  expirationDate?: string;
  credentialId?: string;
  url?: string;
};

export type Education = {
  institution: string;
  degree: string;
  field?: string;
  period: Period;
};

export type Profile = {
  name: string;
  nameKana?: string;
  title: string;
  summary: string;
  avatar?: string;
};

export type PortfolioData = {
  profile: Profile;
  workExperience: WorkExperience[];
  projects: Project[];
  skills: Skill[];
  certifications?: Certification[];
  education?: Education[];
};
