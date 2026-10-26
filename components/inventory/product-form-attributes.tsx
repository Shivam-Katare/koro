"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CATEGORY_ATTRIBUTE_PRESETS } from "@/lib/validations/product";
import { Plus, Trash2, Sparkles } from "lucide-react";

interface ProductFormAttributesProps {
  category: string;
  attributes: Record<string, any>;
  onChange: (attrs: Record<string, any>) => void;
  disabled?: boolean;
}

export function ProductFormAttributes({
  category,
  attributes,
  onChange,
  disabled,
}: ProductFormAttributesProps) {
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");
  const [showCustomAdder, setShowCustomAdder] = useState(false);

  const presets = CATEGORY_ATTRIBUTE_PRESETS[category] || [
    { label: "Variant", key: "variant", placeholder: "e.g. Standard" },
    { label: "Box / Drawer", key: "box_number", placeholder: "e.g. BOX-1" },
  ];

  const handleAttrChange = (key: string, value: string) => {
    const updated = { ...attributes };
    if (!value || value.trim() === "") {
      delete updated[key];
    } else {
      updated[key] = value.trim();
    }
    onChange(updated);
  };

  const handleAddCustom = () => {
    if (!customKey.trim() || !customValue.trim()) return;
    const cleanKey = customKey.trim().toLowerCase().replace(/\s+/g, "_");
    onChange({ ...attributes, [cleanKey]: customValue.trim() });
    setCustomKey("");
    setCustomValue("");
    setShowCustomAdder(false);
  };

  const handleRemove = (key: string) => {
    const updated = { ...attributes };
    delete updated[key];
    onChange(updated);
  };

  return (
    <div className="space-y-3 pt-3 border-t border-border/70">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Category Attributes ({category})
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1 px-2.5 rounded-full text-primary hover:text-primary hover:bg-primary/10 border-primary/20"
          onClick={() => setShowCustomAdder(!showCustomAdder)}
          disabled={disabled}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Custom Field</span>
        </Button>
      </div>

      {/* Preset dynamic fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {presets.map((preset) => (
          <div key={preset.key} className="space-y-1.5">
            <Label htmlFor={`attr-${preset.key}`} className="text-sm font-medium text-foreground">
              {preset.label}
            </Label>
            <Input
              id={`attr-${preset.key}`}
              placeholder={preset.placeholder}
              value={attributes[preset.key] || ""}
              onChange={(e) => handleAttrChange(preset.key, e.target.value)}
              disabled={disabled}
              className="h-10 rounded-xl text-sm bg-background border-border"
            />
          </div>
        ))}
      </div>

      {/* Custom attributes added by user */}
      {Object.entries(attributes).some(([k]) => !presets.some((p) => p.key === k)) && (
        <div className="space-y-2 pt-1">
          <span className="text-xs text-muted-foreground font-medium">Extra Custom Tags:</span>
          <div className="flex flex-wrap gap-2">
            {Object.entries(attributes)
              .filter(([k]) => !presets.some((p) => p.key === k))
              .map(([k, v]) => (
                <div
                  key={k}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 text-xs shadow-2xs"
                >
                  <span className="font-semibold text-foreground capitalize">{k.replace(/_/g, " ")}:</span>
                  <span className="text-muted-foreground">{String(v)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemove(k)}
                    className="text-muted-foreground hover:text-destructive transition-colors ml-0.5 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Custom attribute adder inline modal */}
      {showCustomAdder && (
        <div className="flex flex-col sm:flex-row items-center gap-2 p-3 rounded-2xl border border-primary/30 bg-primary/5">
          <Input
            placeholder="Field name (e.g. Color, Shade, Box)"
            value={customKey}
            onChange={(e) => setCustomKey(e.target.value)}
            className="text-xs h-9 rounded-xl bg-background"
          />
          <Input
            placeholder="Value (e.g. Golden, Box-4)"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            className="text-xs h-9 rounded-xl bg-background"
          />
          <Button
            type="button"
            size="sm"
            onClick={handleAddCustom}
            className="h-9 text-xs rounded-xl px-4 shrink-0 font-semibold"
            disabled={!customKey.trim() || !customValue.trim()}
          >
            Save Tag
          </Button>
        </div>
      )}
    </div>
  );
}
