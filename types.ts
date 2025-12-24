
export interface ResumeAnalysis {
  id: string;
  timestamp: number;
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    linkedin?: string;
  };
  score: {
    overall: number;
    formatting: number;
    impact: number;
    keywords: number;
    relevance: number;
  };
  summary: string;
  sections: {
    experience: ExperienceItem[];
    education: EducationItem[];
    skills: string[];
  };
  improvements: {
    category: string;
    suggestion: string;
    priority: 'High' | 'Medium' | 'Low';
  }[];
  upskilling: string[];
}

export interface ExperienceItem {
  company: string;
  role: string;
  duration: string;
  description: string[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  year: string;
}

export interface AnalysisHistoryItem {
  id: string;
  name: string;
  overallScore: number;
  timestamp: number;
}
