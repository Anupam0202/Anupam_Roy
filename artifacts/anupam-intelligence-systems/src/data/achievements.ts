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
  swagPhotos: [swagAll, swagJacket, swagPens, swagBrush, swagVacuumPrinter, swagLamp],
};

export const achievements: Achievement[] = [
  {
    title: "Google Cloud Platform Mastery",
    proof: "Early Adopter recognition, 3 Technical Expert badges, 4 consecutive Arcade seasons, Legend milestone unlocked.",
    summary:
      "Completed Customer Engagement Suite with Google AI, Intelligent Search, and Build with Vertex AI badges while compounding hands-on GCP learning through Google Cloud Arcade.",
    metrics: [
      { value: "3", label: "Technical Expert Badges" },
      { value: "4", label: "Consecutive Arcade Seasons" },
      { value: "Legend", label: "Milestone" },
    ],
    links: [
      { label: "LinkedIn Post - Expert Badges", href: "https://www.linkedin.com/posts/anupam--roy_googlecloud-vertexai-accenture-activity-7367557930969182210-Goq9" },
      { label: "LinkedIn Post - Legend Milestone", href: "https://www.linkedin.com/posts/anupam--roy_googlecloud-gcp-learninganddevelopment-activity-7385948527765639168-SuDJ" },
    ],
  },
  {
    title: "Credly Top Badge Earner of 2024",
    proof: "180+ Credly badges and public verification profile.",
    summary:
      "A visible record of consistent learning across cloud, AI, security, data, DevOps, and platform ecosystems.",
    metrics: [
      { value: "180+", label: "Credly Badges" },
      { value: "2024", label: "Top Badge Earner" },
    ],
    links: [
      { label: "Top Badge Earner Proof", href: "https://www.credly.com/badges/3d899907-7a72-4cac-80d0-c7f80d9a892c/public_url" },
      { label: "Credly Profile", href: "https://www.credly.com/users/anupam_roy/" },
    ],
  },
  {
    title: "Chess Discipline",
    proof: "1000+ ELO in Rapid on Chess.com.",
    summary:
      "A practical signal of pattern recognition, calculation discipline, and decision-making under constraints.",
    metrics: [{ value: "1000+", label: "Rapid ELO" }],
    links: [{ label: "Chess.com Profile", href: "https://www.chess.com/member/anuroytwo" }],
  },
];
