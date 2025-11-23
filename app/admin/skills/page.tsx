/**
 * Skills Configuration Page
 *
 * View and edit skill configurations and formula constants
 */

"use client";

import { SkillConfigEditor } from "@/components/admin/SkillConfigEditor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useSkillsConfig, updateSkillConfig } from "@/lib/hooks/useAdminData";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function SkillsPage() {
  const { data, isLoading, mutate } = useSkillsConfig();

  const handleSaveConfig = async (skillId: string, config: any) => {
    try {
      await updateSkillConfig(skillId, config);
      toast.success("Skill configuration updated successfully");
      toast.warning("Run evaluation suite to validate changes");
      mutate();
    } catch (error) {
      toast.error("Failed to update skill configuration");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Skills Configuration
        </h1>
        <p className="text-gray-500 mt-2">
          Manage skill settings and formula constants
        </p>
      </div>

      {/* Skills Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Active Skills</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {data?.skills?.map((skill: any) => (
                <div
                  key={skill.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-medium">{skill.skill_name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">v{skill.skill_version}</Badge>
                      <Badge variant={skill.enabled ? "default" : "outline"}>
                        {skill.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                      {skill.last_validated && (
                        <span className="text-xs text-gray-500">
                          Validated{" "}
                          {formatDistanceToNow(new Date(skill.last_validated), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuration Editors */}
      <div className="space-y-6">
        {isLoading ? (
          <>
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </>
        ) : (
          data?.skills?.map((skill: any) => (
            <SkillConfigEditor
              key={skill.id}
              config={skill}
              onSave={(config) => handleSaveConfig(skill.id, config)}
            />
          ))
        )}
      </div>

      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data?.version_history?.map((version: any, i: number) => (
              <div
                key={i}
                className="flex items-start justify-between p-3 border-b last:border-0"
              >
                <div>
                  <div className="font-medium">{version.skill_name}</div>
                  <div className="text-sm text-gray-500 mt-1">
                    {version.change_description}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">v{version.version}</Badge>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(version.created_at), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </div>
            ))}
            {(!data?.version_history || data.version_history.length === 0) && (
              <p className="text-sm text-gray-500 text-center py-8">
                No version history available
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
