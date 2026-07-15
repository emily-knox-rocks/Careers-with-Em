export type DimView = { fit: string; note: string };

export type JobRowView = {
  id: string;
  title: string;
  company: string;
  bucketName: string | null;
  location: string;
  remote: string;
  comp: string;
  companySize: string | null;
  industry: string | null;
  postedAt: string | null;
  overall: string | null; // great | good | okay | poor | null (unranked)
  justification: string;
  engine: string;
  stale: boolean; // score is from an older IJP version
  dims: {
    skills: DimView;
    seniority: DimView;
    comp: DimView;
    location: DimView;
  } | null;
  skillLevels: Record<string, { level: string; note: string }>;
  feedback: { verdict: string; reason: string } | null;
};
