"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify/unstyled";
import { NodeTemplate } from "@/components/drag-and-drop/types";

const TEMPLATE_STORAGE_KEY = "templates";

function loadTemplates(): NodeTemplate[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveTemplates(templates: NodeTemplate[]) {
  localStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(templates));
}

export function usePersistTemplate() {
  const [templates, setTemplates] = useState<NodeTemplate[]>([]);

  useEffect(() => {
    setTemplates(loadTemplates());
  }, []);

  // Add a new template
  const addTemplate = useCallback(
    (template: NodeTemplate) => {
      const exists = templates.some(
        (t) =>
          t.name === template.name && t.moduleClass === template.moduleClass,
      );

      if (exists) {
        toast.error("Template with this name already exists for this module.");
        return false;
      }

      const updated = [...templates, template];
      setTemplates(updated);
      saveTemplates(updated);
      toast.success("Template saved successfully!");
      return true;
    },
    [templates],
  );

  // Remove a template
  const removeTemplate = useCallback((name: string, moduleClass: string) => {
    setTemplates((prev) => {
      const updated = prev.filter(
        (t) => !(t.name === name && t.moduleClass === moduleClass),
      );
      saveTemplates(updated);
      return updated;
    });
    toast.success("Template deleted successfully!");
  }, []);

  // Export a single template
  const exportTemplate = useCallback((template: NodeTemplate) => {
    let name = window.prompt("Enter a name for this template", template.name);

    if (!name || !name.trim()) {
      toast.error("Export cancelled: name is required.");
      return;
    }
    name = name.trim();

    const exportData: NodeTemplate = {
      ...template,
      name,
    };

    try {
      const data = JSON.stringify(exportData, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.json`; // filename matches template name
      a.click();

      URL.revokeObjectURL(url);
      toast.success(`Template "${name}" exported successfully!`);
    } catch (e) {
      console.error("Export failed:", e);
      toast.error("Failed to export template.");
    }
  }, []);

  // Import a single template
  const importTemplate = useCallback(
    async (file: File, currentModuleClass: string) => {
      console.log("import");
      const text = await file.text();
      try {
        const parsed: NodeTemplate = JSON.parse(text);

        if (parsed.moduleClass !== currentModuleClass) {
          toast.error("Cannot import template: module class mismatch.");
          return;
        }

        const duplicate = templates.some(
          (t) => t.name === parsed.name && t.moduleClass === parsed.moduleClass,
        );
        console.log("dupl", duplicate);
        if (duplicate) {
          toast.error("Template with this name already exists.");
          return;
        }

        const updated = [...templates, parsed];
        setTemplates(updated);
        saveTemplates(updated);
        toast.success("Template imported successfully!");
      } catch (e) {
        console.error(e);
        toast.error("Invalid template file.");
      }
    },
    [templates],
  );

  return {
    templates,
    addTemplate,
    removeTemplate,
    exportTemplate,
    importTemplate,
  };
}
