const BASE = import.meta.env.BASE_URL;

export type ProviderKey = "all" | "aws" | "google" | "microsoft" | "snowflake" | "databricks" | "anthropic" | "mongodb";

export interface Cert {
  key: ProviderKey;
  provider: string;
  color: string;
  name: string;
  level: string;
  issued: string;
  expires: string;
  certId: string;
  pdf: string;
  thumb: string;
  verify: string;
}

const C = (key: ProviderKey, provider: string, color: string, name: string, level: string, issued: string, expires: string, certId: string, pdf: string, verify: string): Cert =>
  ({ key, provider, color, name, level, issued, expires, certId, pdf: `${BASE}certs/${pdf}`, thumb: `${BASE}cert-thumbs/${pdf.replace(/\.pdf$/, ".webp")}`, verify });

export const ALL_CERTS: Cert[] = [
  /* ── AWS ── */
  C("aws","AWS","#FF9900","ML Engineer - Associate","Associate","May 1, 2026","May 1, 2029","73f6f6a4aef3451f8e162b227f13c350","aws-ml-engineer-associate.pdf","https://www.credly.com/badges/abba82dd-73e2-46b7-967c-2ddbbfe40126/public_url"),
  C("aws","AWS","#FF9900","Advanced Networking - Specialty","Specialty","Dec 22, 2025","Dec 22, 2028","a25541bf7d1c4700b66ed7680719e528","aws-advanced-networking-specialty.pdf","https://www.credly.com/badges/ff0365d6-a240-46a2-888b-fb72c0d9c8d6/public_url"),
  C("aws","AWS","#FF9900","Cloud Practitioner","Foundational","Dec 22, 2024","May 1, 2029","44984f9bed4c48078fd47de60e52baf4","aws-cloud-practitioner.pdf","https://www.credly.com/badges/c66f5645-8a07-449d-b2ac-7629e892702a/public_url"),

  /* ── Google Cloud ── */
  C("google","Google Cloud","#4285F4","Generative AI Leader","Expert","Jul 3, 2025","Jul 3, 2028","8274b203c07c4e31a0a9efc3efc165d4","google-generative-ai-leader.pdf","https://www.credly.com/badges/4b01e73a-8e53-4d6c-97ed-c0a249b4e086/public_url"),
  C("google","Google Cloud","#4285F4","Professional Cloud Architect","Professional","Jul 13, 2024","Jul 13, 2026","bca96f9685ed4ab7abfabab98d3c35f4","google-professional-cloud-architect.pdf","https://www.credly.com/badges/f486243e-ddce-4a98-bb96-20a7b54f9f1b/public_url"),
  C("google","Google Cloud","#4285F4","Professional ML Engineer","Professional","Oct 11, 2024","Oct 11, 2026","71ef1a244c1842808abb9f8ffc0bd8f1","google-professional-ml-engineer.pdf","https://www.credly.com/badges/877f3676-e647-4df5-8845-f566ea7f0c1e/public_url"),
  C("google","Google Cloud","#4285F4","Professional Data Engineer","Professional","Jul 16, 2024","Oct 10, 2026","dc715c4ffb914ee7b09cfdc41f3da904","google-professional-data-engineer.pdf","https://www.credly.com/badges/50633dd1-dc56-4984-9d20-9486b16899c1/public_url"),
  C("google","Google Cloud","#4285F4","Professional Cloud Security Engineer","Professional","Nov 1, 2024","Nov 1, 2026","74de16890d19453481fa951a0737df66","google-professional-cloud-security-engineer.pdf","https://www.credly.com/badges/cb951777-bbbc-4a04-a44e-38b3e4409cb0/public_url"),
  C("google","Google Cloud","#4285F4","Professional Cloud Network Engineer","Professional","Nov 1, 2024","Nov 1, 2026","34d5ddbddc6340d8baf018417d9456df","google-professional-cloud-network-engineer.pdf","https://www.credly.com/badges/62add79a-0e68-4fe1-97c4-00ad9f427255/public_url"),
  C("google","Google Cloud","#4285F4","Professional Cloud DevOps Engineer","Professional","Oct 26, 2024","Oct 26, 2026","a3fbab87e5504a3198899ee3159682d4","google-professional-cloud-devops-engineer.pdf","https://www.credly.com/badges/7cefb295-0790-4b38-bfc7-9876bc521e98/public_url"),
  C("google","Google Cloud","#4285F4","Professional Cloud Developer","Professional","Oct 25, 2024","Oct 25, 2026","ab01cd92a3dc4b88b7e77a66a9d551e0","google-professional-cloud-developer.pdf","https://www.credly.com/badges/e6067b76-8cf4-4238-800a-15771a747efd/public_url"),
  C("google","Google Cloud","#4285F4","Professional Cloud Database Engineer","Professional","Nov 1, 2024","Nov 1, 2026","6cad9f7a47574337bbe8bd41c150fd97","google-professional-cloud-database-engineer.pdf","https://www.credly.com/badges/8d3b2f12-fab4-4a12-8a27-3e6a7447fdce/public_url"),
  C("google","Google Cloud","#4285F4","Professional GWS Administrator","Professional","Nov 1, 2024","Nov 1, 2026","660425ebc3eb42ba8f6c107a9f59b0cb","google-professional-gws-admin.pdf","https://www.credly.com/badges/609ea3c1-a21c-406b-aaea-58b0a4942e95/public_url"),
  C("google","Google Cloud","#4285F4","Associate Cloud Engineer","Associate","May 24, 2024","May 24, 2027","31bae5506d7f484f98e12a11982c67c6","google-associate-cloud-engineer.pdf","https://www.credly.com/badges/3b6ff1dd-7e4d-4763-8ae9-72df6a479cdf/public_url"),
  C("google","Google Cloud","#4285F4","Associate Data Practitioner","Associate","Feb 21, 2025","Feb 21, 2028","74fbce26dc3e416989ba14fa7e0bc7ec","google-associate-data-practitioner.pdf","https://www.credly.com/badges/34d0cf23-4279-42df-b258-ca2fc211e987/public_url"),
  C("google","Google Cloud","#4285F4","Associate GWS Administrator","Associate","Feb 21, 2025","Feb 21, 2028","727cfc31edac42249d390aefefbe081b","google-associate-gws-admin.pdf","https://www.credly.com/badges/080d4d45-da7e-4ec9-9591-0eb283887c28/public_url"),
  C("google","Google Cloud","#4285F4","Cloud Digital Leader","Foundational","Dec 21, 2024","Dec 21, 2027","d37d1f3ea91f4ef3acffdaa65e70c574","google-cloud-digital-leader.pdf","https://www.credly.com/badges/fc7bde6f-a96b-4ab8-846d-ef8c22cf11b7/public_url"),

  /* ── Databricks ── */
  C("databricks","Databricks","#FF3621","Generative AI Engineer Associate","Associate","Jan 29, 2026","Jan 29, 2028","172915013","databricks-genai-engineer-associate.pdf","https://credentials.databricks.com/65e9a608-48dd-43e8-8f63-134231a861a3"),
  C("databricks","Databricks","#FF3621","Data Engineer Associate","Associate","—","—","—","databricks-data-engineer-associate.pdf","https://credentials.databricks.com/42c2f101-be3c-4ecc-8ae4-ab4959b14ef7"),

  /* ── Snowflake ── */
  C("snowflake","Snowflake","#29B5E8","SnowPro Core","Core","Apr 27, 2025","Sep 27, 2027","S112949-250427-COF","snowflake-snowpro-core.pdf","https://achieve.snowflake.com/e0f74ad0-0363-43d3-b15a-d3a1457dd03b"),
  C("snowflake","Snowflake","#29B5E8","SnowPro Advanced: Administrator","Advanced","Sep 27, 2025","Sep 27, 2027","S112949-250927-ADA","snowflake-snowpro-advanced-administrator.pdf","https://achieve.snowflake.com/b30b4566-d900-4322-aa31-9f3568ed4174"),
  C("snowflake","Snowflake","#29B5E8","SnowPro Advanced: Architect","Advanced","Sep 22, 2025","Sep 27, 2027","S112949-250922-ARA","snowflake-snowpro-advanced-architect.pdf","https://achieve.snowflake.com/9d19adca-a1d8-4d05-8f0c-fd22356797aa"),
  C("snowflake","Snowflake","#29B5E8","SnowPro Advanced: Data Analyst","Advanced","Sep 27, 2025","Sep 27, 2027","S112949-250927-DAA","snowflake-snowpro-advanced-data-analyst.pdf","https://achieve.snowflake.com/2a08d55e-22db-465d-98e9-95962e951a05"),
  C("snowflake","Snowflake","#29B5E8","SnowPro Advanced: Data Engineer","Advanced","Sep 27, 2025","Sep 27, 2027","S112949-250927-DEA","snowflake-snowpro-advanced-data-engineer.pdf","https://achieve.snowflake.com/40d34f67-48bf-4f40-ad5b-6623f83d3048"),
  C("snowflake","Snowflake","#29B5E8","SnowPro Advanced: Data Scientist","Advanced","Sep 26, 2025","Sep 27, 2027","S112949-250926-DSA","snowflake-snowpro-advanced-data-scientist.pdf","https://achieve.snowflake.com/129c01d8-d301-4963-baa8-e22646cbf6c0"),
  C("snowflake","Snowflake","#29B5E8","SnowPro Specialty: Gen AI","Specialty","Sep 22, 2025","Sep 27, 2027","S112949-250922-GES","snowflake-snowpro-specialty-gen-ai.pdf","https://achieve.snowflake.com/aec2a575-7ec6-4c11-8a46-b064fd0a7c10"),

  /* Others */
  C("anthropic","Anthropic","#7C3AED","Claude Certified Architect - Foundations","Foundations","Apr 27, 2026","Oct 27, 2026","v3bg7pbc87fn","claude-certified-architect-foundations.pdf","https://verify.skilljar.com/c/v3bg7pbc87fn"),
  C("mongodb","MongoDB","#00ED64","SI Associate","Associate","Jun 18, 2024","-","MDB8lu03l94pa","mongodb-si-associate.pdf","https://learn.mongodb.com/c/aPi3OPbHRg2Fvwa6oyV8Vw"),

  /* ── Microsoft - Fundamentals ── */
  C("microsoft","Microsoft","#0078D4","Azure Fundamentals","Fundamentals","May 26, 2023","No Expiry","B120773C1846A17","microsoft-azure-fundamentals.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/B120773C1846A17?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Azure AI Fundamentals","Fundamentals","May 29, 2023","No Expiry","1CFE13ABC4888ED6","microsoft-azure-ai-fundamentals.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/1CFE13ABC4888ED6?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Azure Data Fundamentals","Fundamentals","Jun 7, 2023","No Expiry","3884E398D8364524","microsoft-azure-data-fundamentals.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/3884E398D8364524?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Microsoft 365 Fundamentals","Fundamentals","Jun 11, 2023","No Expiry","2E020411669424B5","microsoft-m365-fundamentals.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/2E020411669424B5?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Power Platform Fundamentals","Fundamentals","Jun 15, 2023","No Expiry","63CE8D63F6154129","microsoft-power-platform-fundamentals.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/63CE8D63F6154129?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Security, Compliance & Identity Fundamentals","Fundamentals","Jul 5, 2023","No Expiry","FBF4BC569BB1E212","microsoft-security-compliance-identity-fundamentals.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/FBF4BC569BB1E212?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Dynamics 365 Fundamentals (CRM)","Fundamentals","Jan 24, 2024","No Expiry","3CB039D711EC3B20","microsoft-dynamics-365-fundamentals-crm.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/3CB039D711EC3B20?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Dynamics 365 Fundamentals (ERP)","Fundamentals","Dec 28, 2023","No Expiry","A84FD8DAFD442D14","microsoft-dynamics-365-fundamentals-erp.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/A84FD8DAFD442D14?sharingId=87E510F2D20A449"),

  /* ── Microsoft - Expert ── */
  C("microsoft","Microsoft","#0078D4","Azure Solutions Architect Expert","Expert","Jan 9, 2024","Jan 9, 2027","B178CAC5C8FCAD0C","microsoft-azure-solutions-architect-expert.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/B178CAC5C8FCAD0C?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","DevOps Engineer Expert","Expert","Aug 25, 2023","Sep 14, 2027","14B72377FE073413","microsoft-devops-engineer-expert.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/14B72377FE073413?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Cybersecurity Architect Expert","Expert","Feb 9, 2024","Feb 10, 2027","B707C966F0C9C77D","microsoft-cybersecurity-architect-expert.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/B707C966F0C9C77D?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Power Platform Solution Architect Expert","Expert","Apr 24, 2024","Oct 6, 2026","75D421519F179C98","microsoft-power-platform-solution-architect-expert.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/75D421519F179C98?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Dynamics 365 F&O Solution Architect Expert","Expert","Mar 2, 2024","Mar 2, 2027","697885B17EC9F884","microsoft-dynamics-365-fo-solution-architect-expert.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/697885B17EC9F884?sharingId=87E510F2D20A449"),

  /* ── Microsoft - Azure Associates ── */
  C("microsoft","Microsoft","#0078D4","Azure AI Engineer Associate","Associate","Jun 1, 2023","Jun 2, 2027","B62389D156A906D1","microsoft-azure-ai-engineer-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/B62389D156A906D1?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Azure Administrator Associate","Associate","Aug 25, 2023","Aug 26, 2027","445CD37E604797D9","microsoft-azure-administrator-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/445CD37E604797D9?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Azure Developer Associate","Associate","Sep 13, 2023","Sep 14, 2027","DF038873E69AA2FA","microsoft-azure-developer-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/DF038873E69AA2FA?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Azure Security Engineer Associate","Associate","Jan 4, 2024","Jan 4, 2027","76D7ADA80914D779","microsoft-azure-security-engineer-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/76D7ADA80914D779?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Azure Data Scientist Associate","Associate","Jan 8, 2024","Jan 9, 2027","2434178B458695AA","microsoft-azure-data-scientist-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/2434178B458695AA?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Azure Data Engineer Associate","Associate","Jan 9, 2024","Jan 10, 2026","F4744DA45C602D5B","microsoft-azure-data-engineer-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/F4744DA45C602D5B?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Azure Enterprise Data Analyst Associate","Associate","Jan 9, 2024","Jan 9, 2026","E76B513C89A774DD","microsoft-azure-enterprise-data-analyst.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/E76B513C89A774DD?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Azure Network Engineer Associate","Associate","Jan 5, 2024","Jan 6, 2027","7678A0CA1AC224F4","microsoft-azure-network-engineer-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/7678A0CA1AC224F4?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Azure Database Administrator Associate","Associate","Feb 1, 2024","Feb 2, 2027","74F205608A5B279B","microsoft-azure-database-admin-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/74F205608A5B279B?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Windows Server Hybrid Admin Associate","Associate","Jan 6, 2024","Jan 6, 2027","F354DB29B5CA74B9","microsoft-windows-server-hybrid-admin-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/F354DB29B5CA74B9?sharingId=87E510F2D20A449"),

  /* ── Microsoft - Azure Specialties ── */
  C("microsoft","Microsoft","#0078D4","Azure Cosmos DB Developer Specialty","Specialty","Feb 12, 2024","Feb 12, 2027","81A6AF64F2666BCD","microsoft-azure-cosmos-db-developer-specialty.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/81A6AF64F2666BCD?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Azure Virtual Desktop Specialty","Specialty","Aug 31, 2024","Sep 1, 2027","C3CD90E1334A3D6A","microsoft-azure-virtual-desktop-specialty.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/C3CD90E1334A3D6A?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Azure for SAP Workloads Specialty","Specialty","Jan 29, 2026","Jan 29, 2027","76382824E0E2DDF4","microsoft-azure-sap-workloads-specialty.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/76382824E0E2DDF4?sharingId=87E510F2D20A449"),

  /* ── Microsoft - Security / Identity ── */
  C("microsoft","Microsoft","#0078D4","Identity & Access Administrator Associate","Associate","Feb 8, 2024","Feb 9, 2027","E0248AAEFB53BC67","microsoft-identity-access-admin-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/E0248AAEFB53BC67?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Security Operations Analyst Associate","Associate","Feb 9, 2024","Feb 10, 2027","F4412113A1DAADE6","microsoft-security-operations-analyst-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/F4412113A1DAADE6?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Info Protection & Compliance Admin","Associate","Feb 8, 2024","Feb 8, 2026","B49B4521EE339D35","microsoft-info-protection-compliance-admin.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/B49B4521EE339D35?sharingId=87E510F2D20A449"),

  /* ── Microsoft - Fabric ── */
  C("microsoft","Microsoft","#0078D4","Fabric Data Engineer Associate","Associate","Feb 10, 2025","Feb 11, 2027","DE7D499CB93F5234","microsoft-fabric-data-engineer-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/DE7D499CB93F5234?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Fabric Analytics Engineer Associate","Associate","Aug 30, 2024","Aug 31, 2027","515934CFC19A811A","microsoft-fabric-analytics-engineer-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/515934CFC19A811A?sharingId=87E510F2D20A449"),

  /* ── Microsoft - Power Platform ── */
  C("microsoft","Microsoft","#0078D4","Power BI Data Analyst Associate","Associate","Apr 23, 2024","Apr 24, 2027","F976A67D15231691","microsoft-power-bi-data-analyst-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/F976A67D15231691?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Power Platform Functional Consultant","Associate","Apr 24, 2024","Apr 25, 2027","9D452055BE1056D","microsoft-power-platform-functional-consultant.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/9D452055BE1056D?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Power Platform Developer Associate","Associate","Oct 5, 2024","Oct 6, 2026","13E943893C5FB917","microsoft-power-platform-developer-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/13E943893C5FB917?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Power Platform App Maker Associate","Associate","Feb 24, 2024","Feb 24, 2026","6B7F7727DABB1A41","microsoft-power-platform-app-maker-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/6B7F7727DABB1A41?sharingId=87E510F2D20A449"),

  /* ── Microsoft - M365 ── */
  C("microsoft","Microsoft","#0078D4","M365 Endpoint Administrator Associate","Associate","Aug 31, 2024","Sep 1, 2027","5B5E772E75E60D61","microsoft-m365-endpoint-admin-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/5B5E772E75E60D61?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","M365 Teams Administrator Associate","Associate","Sep 19, 2024","Sep 19, 2027","68EAD72ACE8F283B","microsoft-m365-teams-admin-associate.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/68EAD72ACE8F283B?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","GitHub Copilot Certification","Associate","Dec 24, 2025","Dec 24, 2027","744029EEBC8C6F59","microsoft-github-copilot.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/744029EEBC8C6F59?sharingId=87E510F2D20A449"),

  /* ── Microsoft - Dynamics 365 ── */
  C("microsoft","Microsoft","#0078D4","Dynamics 365 Sales FC Associate","Associate","Feb 2, 2024","Feb 2, 2026","6EBEF3ED62A76AEA","microsoft-dynamics-365-sales-fc.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/6EBEF3ED62A76AEA?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Dynamics 365 Customer Insights FC","Associate","Feb 3, 2024","Feb 3, 2026","B81C87BBC8A3E9F9","microsoft-dynamics-365-customer-insights-journeys.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/B81C87BBC8A3E9F9?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Dynamics 365 Customer Service FC","Associate","Feb 5, 2024","Feb 6, 2027","C3AEE54273511B98","microsoft-dynamics-365-customer-service-fc.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/C3AEE54273511B98?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Dynamics 365 Field Service FC","Associate","Feb 7, 2024","Feb 8, 2027","B2E007F3F5999476","microsoft-dynamics-365-field-service-fc.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/B2E007F3F5999476?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Dynamics 365 F&O Apps Developer","Associate","Feb 6, 2024","Feb 7, 2027","8FAD447A2EE7438F","microsoft-dynamics-365-fo-apps-developer.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/8FAD447A2EE7438F?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Dynamics 365 Business Central FC","Associate","Feb 15, 2024","Feb 16, 2027","E90891A2F0C3A510","microsoft-dynamics-365-business-central-fc.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/E90891A2F0C3A510?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Dynamics 365 Finance FC","Associate","Feb 23, 2024","Feb 24, 2027","58D65B031FB1E141","microsoft-dynamics-365-finance-fc.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/58D65B031FB1E141?sharingId=87E510F2D20A449"),
  C("microsoft","Microsoft","#0078D4","Dynamics 365 Supply Chain FC","Associate","Feb 23, 2024","Feb 24, 2027","F4D9F0C46CB8C683","microsoft-dynamics-365-supply-chain-fc.pdf","https://learn.microsoft.com/api/credentials/share/en-us/RoyAnupam-9387/F4D9F0C46CB8C683?sharingId=87E510F2D20A449"),
];

export const PROVIDER_CONFIG: { key: ProviderKey; label: string; color: string }[] = [
  { key: "all",         label: "All",        color: "#00F5D4" },
  { key: "microsoft",  label: "Microsoft",  color: "#0078D4" },
  { key: "google",     label: "Google",     color: "#4285F4" },
  { key: "snowflake",  label: "Snowflake",  color: "#29B5E8" },
  { key: "aws",        label: "AWS",        color: "#FF9900" },
  { key: "databricks", label: "Databricks", color: "#FF3621" },
  { key: "anthropic",  label: "Anthropic",  color: "#7C3AED" },
  { key: "mongodb",    label: "MongoDB",    color: "#00ED64" },
];

export const LEVEL_STYLE: Record<string, string> = {
  Expert:       "text-yellow-400 bg-yellow-400/10 border-yellow-400/25",
  Professional: "text-violet-400 bg-violet-400/10 border-violet-400/25",
  Advanced:     "text-blue-400  bg-blue-400/10  border-blue-400/25",
  Specialty:    "text-pink-400  bg-pink-400/10  border-pink-400/25",
  Associate:    "text-green-400 bg-green-400/10 border-green-400/25",
  Core:         "text-cyan-400  bg-cyan-400/10  border-cyan-400/25",
  Foundations:  "text-violet-400 bg-violet-400/10 border-violet-400/25",
  Foundational: "text-white/40  bg-white/5     border-white/10",
  Fundamentals: "text-white/40  bg-white/5     border-white/10",
};



export type CertificationCategory =
  | "AI / GenAI"
  | "Cloud Architecture"
  | "Data Engineering / Analytics"
  | "Security / Compliance"
  | "DevOps / Developer"
  | "Business Applications";

const categoryRules: Array<[CertificationCategory, RegExp]> = [
  ["AI / GenAI", /(AI|ML|Machine Learning|Gen AI|Generative|Claude|Copilot)/i],
  ["Security / Compliance", /(Security|Compliance|Identity|Endpoint|Teams|Windows Server)/i],
  ["DevOps / Developer", /(DevOps|Developer|GitHub|Cloud Developer|Apps Developer)/i],
  ["Data Engineering / Analytics", /(Data|Database|Fabric|Power BI|SnowPro|Databricks|MongoDB|Analytics|Cosmos)/i],
  ["Business Applications", /(Dynamics|Power Platform|Business Central|Sales|Customer|Finance|Supply Chain|Field Service)/i],
  ["Cloud Architecture", /(Architect|Cloud|Networking|Network|Administrator|Azure|AWS|Google)/i],
];

export function getCertificationCategory(cert: Cert): CertificationCategory {
  for (const [category, rule] of categoryRules) {
    if (rule.test(`${cert.provider} ${cert.name} ${cert.level}`)) return category;
  }
  return "Cloud Architecture";
}

export const CERTIFICATION_CATEGORIES: CertificationCategory[] = [
  "AI / GenAI",
  "Cloud Architecture",
  "Data Engineering / Analytics",
  "Security / Compliance",
  "DevOps / Developer",
  "Business Applications",
];

export const FEATURED_CERT_NAMES = new Set([
  "ML Engineer - Associate",
  "Generative AI Leader",
  "Professional ML Engineer",
  "Professional Cloud Architect",
  "Generative AI Engineer Associate",
  "Claude Certified Architect - Foundations",
  "GitHub Copilot Certification",
  "SnowPro Specialty: Gen AI",
]);
