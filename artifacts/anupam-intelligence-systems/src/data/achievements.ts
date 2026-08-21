import credlyBadge from "@/assets/achievements/credly-top-badge-earner.png";
import swagAll from "@/assets/achievements/google-cloud-swag-collection.jpg";
import swagJacket from "@/assets/achievements/google-cloud-jacket-bottle.jpg";
import swagPens from "@/assets/achievements/google-cloud-pen-set.jpg";
import swagBrush from "@/assets/achievements/google-cloud-cleaning-brush.jpg";
import swagVacuumPrinter from "@/assets/achievements/google-cloud-vacuum-printer.jpg";
import swagLamp from "@/assets/achievements/google-cloud-globe-lamp.jpg";
import type { Achievement } from "./types";
export const achievementImages = {
  credlyBadge,
  swagPhotos: [
    { src: swagAll, alt: "Google Cloud Arcade recognition collection" },
    { src: swagJacket, alt: "Google Cloud Arcade jacket and bottle" },
    { src: swagPens, alt: "Google Cloud Arcade pen set" },
    { src: swagBrush, alt: "Google Cloud Arcade cleaning brush" },
    {
      src: swagVacuumPrinter,
      alt: "Google Cloud Arcade vacuum and printer rewards",
    },
    { src: swagLamp, alt: "Google Cloud Arcade globe lamp" },
  ],
};
export const achievements: Achievement[] = [
  {
    title: "Google Cloud Platform Mastery",
    proof:
      "Early Adopter recognition, 3 Technical Expert badges, 4 consecutive Arcade seasons, and a Legend milestone.",
    summary:
      "Completed Customer Engagement Suite with Google AI, Intelligent Search, and Build with Vertex AI badges while compounding hands-on GCP learning through Google Cloud Arcade.",
    metrics: [
      { value: "3", label: "Technical Expert Badges" },
      { value: "4", label: "Consecutive Arcade Seasons" },
      { value: "Legend", label: "Milestone" },
    ],
    links: [
      {
        label: "Expert badges post",
        href: "https://www.linkedin.com/posts/anupam--roy_googlecloud-vertexai-accenture-activity-7367557930969182210-Goq9",
      },
      {
        label: "Legend milestone post",
        href: "https://www.linkedin.com/posts/anupam--roy_googlecloud-gcp-learninganddevelopment-activity-7385948527765639168-SuDJ",
      },
    ],
  },
  {
    title: "Credly Top Badge Earner of 2024",
    proof: "180+ Credly badges and a public verification profile.",
    summary:
      "A visible record of consistent learning across cloud, AI, security, data, DevOps, and platform ecosystems.",
    metrics: [
      { value: "180+", label: "Credly Badges" },
      { value: "2024", label: "Top Badge Earner" },
    ],
    links: [
      {
        label: "Recognition proof",
        href: "https://www.credly.com/badges/3d899907-7a72-4cac-80d0-c7f80d9a892c/public_url",
      },
      {
        label: "Credly profile",
        href: "https://www.credly.com/users/anupam_roy/",
      },
    ],
  },
  {
    title: "Competitive Programming Discipline",
    proof:
      "Reached the CodeChef 5-Star tier with a peak rating of 2109 through sustained algorithmic problem-solving practice.",
    summary:
      "Competitive programming strengthened the data-structure, algorithm, debugging, and time-complexity instincts that support reliable engineering decisions.",
    metrics: [
      { value: "5★", label: "CodeChef Tier" },
      { value: "2109", label: "Peak Rating" },
    ],
    links: [
      {
        label: "CodeChef profile",
        href: "https://www.codechef.com/users/anupam_roy",
      },
    ],
  },
];
