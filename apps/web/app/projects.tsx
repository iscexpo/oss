"use client";

import { Projects as ProjectsComponent } from "@/components/projects/projects";

interface Props {
  className: string;
}

export function Projects({ className }: Props) {
  return <ProjectsComponent className={className} />;
}