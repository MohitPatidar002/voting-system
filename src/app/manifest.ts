import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gandhawad Village Portal",
    short_name: "Village OS",
    description:
      "Gram Panchayat portal — schemes, complaints, polls, budget and development for the village.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#15803d",
    lang: "hi",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
