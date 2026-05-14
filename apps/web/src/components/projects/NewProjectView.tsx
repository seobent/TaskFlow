"use client";

import type { Project } from "@taskflow/shared";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  ProjectForm,
  type ProjectFormValues,
} from "@/components/projects/ProjectForm";
import {
  readApiData,
  readApiErrorMessage,
  readResponseJson,
} from "@/lib/api-client";

export function NewProjectView() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(values: ProjectFormValues) {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/projects", {
        body: JSON.stringify({
          description: values.description || undefined,
          name: values.name,
        }),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });
      const body = await readResponseJson(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (!response.ok) {
        setError(readApiErrorMessage(body, "Unable to create project."));
        return;
      }

      const payload = readApiData<{ project: Project }>(body);
      router.replace(
        payload?.project?.id
          ? `/dashboard/projects/${payload.project.id}`
          : "/dashboard/projects",
      );
      router.refresh();
    } catch {
      setError("Unable to reach TaskFlow. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <ProjectForm
      cancelHref="/dashboard/projects"
      error={error}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit}
      submitLabel="Create project"
      submittingLabel="Creating..."
    />
  );
}
