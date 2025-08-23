"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify/unstyled";
import { NodeTemplate } from "@/components/drag-and-drop/types";
import { displayError } from "@/utils/sharedFunctionality";
import { showUndoToast } from "@/utils/UndoToast";

const TEMPLATE_STORAGE_KEY = "templates";

function loadTemplates(): NodeTemplate[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(TEMPLATE_STORAGE_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
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
        displayError(
          `Template with name ${template.name} already exists for this module.`,
        );
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
  const removeTemplate = useCallback(
    (name: string, moduleClass: string) => {
      const templateToBeRemoved = templates.find(
        (t) => t.name === name && t.moduleClass === moduleClass,
      );
      setTemplates((prev) => {
        const updated = prev.filter(
          (t) => !(t.name === name && t.moduleClass === moduleClass),
        );
        saveTemplates(updated);
        return updated;
      });

      showUndoToast(
        `Template ${name} deleted successfully!`,
        `Template ${name} Restored`,
        templateToBeRemoved !== undefined,
        () => {
          // Restore previous state
          setTemplates((prev) => {
            if (templateToBeRemoved) {
              const restored = [...prev, templateToBeRemoved];
              saveTemplates(restored);
              return restored;
            }
            return prev;
          });
        },
      );
    },
    [templates],
  );

  // Export a single template
  const exportTemplate = useCallback((template: NodeTemplate) => {
    const name = window
      .prompt("Enter a name for this template", template.name)
      ?.trim();

    if (!name) {
      displayError("Export cancelled: name is required.");
      return;
    }

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
      displayError("Failed to export template.");
    }
  }, []);

  // Import a single template
  const importTemplate = useCallback(
    async (file: File, currentModuleClass: string) => {
      const text = await file.text();
      try {
        const parsed: NodeTemplate = JSON.parse(text);

        if (parsed.moduleClass !== currentModuleClass) {
          displayError("Cannot import template: module class mismatch.");
          return;
        }

        const duplicate = templates.some(
          (t) => t.name === parsed.name && t.moduleClass === parsed.moduleClass,
        );
        if (duplicate) {
          displayError("Template with this name already exists.");
          return;
        }

        const updated = [...templates, parsed];
        setTemplates(updated);
        saveTemplates(updated);
        toast.success("Template imported successfully!");
      } catch (e) {
        console.error(e);
        displayError("Invalid template file.");
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
