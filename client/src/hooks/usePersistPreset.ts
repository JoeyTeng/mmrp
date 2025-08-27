"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify/unstyled";
import { NodePreset } from "@/components/drag-and-drop/types";
import { displayError } from "@/utils/sharedFunctionality";
import { showUndoToast } from "@/utils/UndoToast";

const PRESET_STORAGE_KEY = "presets";

function loadPresets(): NodePreset[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(PRESET_STORAGE_KEY);
  try {
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePresets(presets: NodePreset[]) {
  localStorage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets));
}

export function usePersistPreset() {
  const [presets, setPresets] = useState<NodePreset[]>([]);

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  // Add a new preset
  const addPreset = useCallback(
    (preset: NodePreset) => {
      const exists = presets.some(
        (t) => t.name === preset.name && t.moduleClass === preset.moduleClass,
      );

      if (exists) {
        displayError(
          `Preset with name ${preset.name} already exists for this module.`,
        );
        return false;
      }

      const updated = [...presets, preset];
      setPresets(updated);
      savePresets(updated);
      toast.success("Preset saved successfully!");
      return true;
    },
    [presets],
  );

  // Remove a preset
  const removePreset = useCallback(
    (name: string, moduleClass: string) => {
      const presetToBeRemoved = presets.find(
        (t) => t.name === name && t.moduleClass === moduleClass,
      );
      setPresets((prev) => {
        const updated = prev.filter(
          (t) => !(t.name === name && t.moduleClass === moduleClass),
        );
        savePresets(updated);
        return updated;
      });

      showUndoToast(
        `Preset ${name} deleted successfully!`,
        `Preset ${name} Restored`,
        presetToBeRemoved !== undefined,
        () => {
          // Restore previous state
          setPresets((prev) => {
            if (presetToBeRemoved) {
              const restored = [...prev, presetToBeRemoved];
              savePresets(restored);
              return restored;
            }
            return prev;
          });
        },
      );
    },
    [presets],
  );

  // Export a single preset
  const exportPreset = useCallback((preset: NodePreset) => {
    const name = window
      .prompt("Enter a name for this preset", preset.name)
      ?.trim();

    if (!name) {
      displayError("Export cancelled: name is required.");
      return;
    }

    const exportData: NodePreset = {
      ...preset,
      name,
    };

    try {
      const data = JSON.stringify(exportData, null, 2);
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}.json`; // filename matches preset name
      a.click();

      URL.revokeObjectURL(url);
      toast.success(`Preset "${name}" exported successfully!`);
    } catch (e) {
      console.error("Export failed:", e);
      displayError("Failed to export preset.");
    }
  }, []);

  // Import a single preset
  const importPreset = useCallback(
    async (file: File, currentModuleClass: string) => {
      const text = await file.text();
      try {
        const parsed: NodePreset = JSON.parse(text);

        if (parsed.moduleClass !== currentModuleClass) {
          displayError("Cannot import preset: module class mismatch.");
          return;
        }

        const duplicate = presets.some(
          (t) => t.name === parsed.name && t.moduleClass === parsed.moduleClass,
        );
        if (duplicate) {
          displayError("Preset with this name already exists.");
          return;
        }

        const updated = [...presets, parsed];
        setPresets(updated);
        savePresets(updated);
        toast.success("Preset imported successfully!");
      } catch (e) {
        console.error(e);
        displayError("Invalid preset file.");
      }
    },
    [presets],
  );

  return {
    presets,
    addPreset,
    removePreset,
    exportPreset,
    importPreset,
  };
}
