export type ProvenanceStatus =
  | "verified_public_source"
  | "repository_documented"
  | "owner_reported"
  | "illustrative"
  | "proposed"
  | "unverified"
  | "unavailable";

/**
 * How the evidence was established — the spec asks to distinguish these.
 * "inspected-source" means the implementation itself was read at a commit.
 */
export type EvidenceMethod =
  | "owner-statement"
  | "repository-documentation"
  | "inspected-source"
  | "executed-test"
  | "deployed-behavior"
  | "independent-public"
  | "certificate-document";

export type ClaimSubject =
  | "profile"
  | "experience"
  | "nexusrag"
  | "plantpal"
  | "projects"
  | "credentials"
  | "achievements"
  | "education"
  | "site";

export interface ClaimEvidence {
  id: string;
  subject: ClaimSubject;
  claim: string;
  status: ProvenanceStatus;
  method: EvidenceMethod;
  sourceTitle?: string;
  sourceUrl?: string;
  repository?: string;
  path?: string;
  commitSha?: string;
  sourceExcerpt?: string;
  verifiedAt?: string;
  limitations?: string[];
  public: boolean;
}

export const STATUS_LABEL: Record<ProvenanceStatus, string> = {
  verified_public_source: "Verified public source",
  repository_documented: "Repository documented",
  owner_reported: "Owner reported",
  illustrative: "Illustrative",
  proposed: "Proposed",
  unverified: "Unverified",
  unavailable: "Unavailable",
};

export const STATUS_DESCRIPTION: Record<ProvenanceStatus, string> = {
  verified_public_source: "Checked against an independent public source on the date shown.",
  repository_documented: "Stated or implemented in a public repository at the commit shown. Not independently tested here.",
  owner_reported: "Reported by Anupam. Not independently audited.",
  illustrative: "A representative example or diagram, not a record of a specific system.",
  proposed: "Planned or designed, not yet built.",
  unverified: "Present in the source material but not yet checked.",
  unavailable: "The evidence could not be obtained.",
};

export const METHOD_LABEL: Record<EvidenceMethod, string> = {
  "owner-statement": "Owner statement",
  "repository-documentation": "Repository documentation",
  "inspected-source": "Inspected source code",
  "executed-test": "Executed test",
  "deployed-behavior": "Deployed behaviour",
  "independent-public": "Independent public evidence",
  "certificate-document": "Certificate document",
};
