"use client";

/**
 * Skill Config Editor Component
 *
 * Form for editing formula constants
 * Validates inputs and shows warning about eval requirements
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Save } from "lucide-react";

interface FormulaConstant {
  key: string;
  value: number;
  description: string;
  unit?: string;
}

interface SkillConfig {
  id: string;
  skill_name: string;
  skill_version: string;
  enabled: boolean;
  conversion_rates: Record<string, number>;
  thresholds: Record<string, number>;
  last_validated?: string;
}

interface SkillConfigEditorProps {
  config: SkillConfig;
  onSave?: (config: SkillConfig) => void;
}

export function SkillConfigEditor({ config, onSave }: SkillConfigEditorProps) {
  const [formData, setFormData] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);

  const constants: FormulaConstant[] = [
    {
      key: "compactor_ypd",
      value: formData.conversion_rates.compactor_ypd || 14.49,
      description: "Compactor Yards Per Door Conversion",
      unit: "yards/ton",
    },
    {
      key: "dumpster_ypd",
      value: formData.conversion_rates.dumpster_ypd || 4.33,
      description: "Dumpster Yards Per Door Conversion",
      unit: "weeks/month",
    },
    {
      key: "target_capacity",
      value: formData.thresholds.target_capacity || 8.5,
      description: "Target Compactor Capacity",
      unit: "tons",
    },
    {
      key: "optimization_threshold",
      value: formData.thresholds.optimization_threshold || 6.0,
      description: "Optimization Threshold",
      unit: "tons",
    },
  ];

  const handleChange = (
    key: string,
    value: number,
    type: "conversion_rates" | "thresholds",
  ) => {
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [key]: value,
      },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave?.(formData);
    setHasChanges(false);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{config.skill_name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">v{config.skill_version}</Badge>
              <Badge variant={config.enabled ? "default" : "outline"}>
                {config.enabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning Banner */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Warning</AlertTitle>
          <AlertDescription>
            Changing formula constants requires running the full evaluation
            suite to ensure calculations remain accurate. All changes must be
            validated before deployment.
          </AlertDescription>
        </Alert>

        {/* Formula Constants */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm text-gray-700">
            Formula Constants
          </h3>
          {constants.map((constant) => {
            const type =
              constant.key.includes("ypd") || constant.key.includes("capacity")
                ? "conversion_rates"
                : "thresholds";

            return (
              <div key={constant.key} className="grid gap-2">
                <Label htmlFor={constant.key} className="text-sm">
                  {constant.description}
                  {constant.unit && (
                    <span className="text-gray-500 ml-2">
                      ({constant.unit})
                    </span>
                  )}
                </Label>
                <Input
                  id={constant.key}
                  type="number"
                  step="0.01"
                  value={constant.value}
                  onChange={(e) =>
                    handleChange(constant.key, parseFloat(e.target.value), type)
                  }
                  className="max-w-xs"
                />
              </div>
            );
          })}
        </div>

        {/* Last Validated */}
        {config.last_validated && (
          <div className="text-sm text-gray-500">
            Last validated: {new Date(config.last_validated).toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
