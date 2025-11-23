"use client";

/**
 * New Project Creation Page
 *
 * Multi-step wizard for creating a new waste analysis project
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, ChevronLeft, Building2 } from "lucide-react";
import { toast } from "sonner";

// Form validation schema
const projectSchema = z.object({
  property_name: z.string().min(1, "Property name is required"),
  city: z.string().min(1, "City is required"),
  state: z
    .string()
    .min(2, "State is required")
    .max(2, "Use 2-letter state code"),
  units: z.coerce.number().int().min(1, "Must have at least 1 unit"),
  property_type: z.string().optional(),
  equipment_type: z.string().optional(),
  analysis_period_months: z.coerce.number().int().min(1).max(12).optional(),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function NewProjectPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      property_name: "",
      city: "",
      state: "",
      units: 0,
      property_type: "",
      equipment_type: "",
      analysis_period_months: 6,
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Create project in database
      const { data: project, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          property_name: data.property_name,
          city: data.city,
          state: data.state.toUpperCase(),
          units: data.units,
          property_type: data.property_type || null,
          equipment_type: data.equipment_type || null,
          analysis_period_months: data.analysis_period_months || null,
          status: "draft",
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Show success toast and redirect
      toast.success("Project created successfully!");
      router.push(`/projects/${project.id}`);
      router.refresh();
    } catch (error) {
      console.error("Error creating project:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to create project. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/projects")}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Create New Project
          </h1>
          <p className="text-muted-foreground">
            Add a new property for waste management analysis
          </p>
        </div>
      </div>

      {/* Form Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-green-600" />
            Property Information
          </CardTitle>
          <CardDescription>
            Enter details about the property you want to analyze
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Property Name */}
              <FormField
                control={form.control}
                name="property_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Name *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Oak Park Apartments"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      The name of the property or building
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Austin" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., TX"
                          maxLength={2}
                          {...field}
                          onChange={(e) =>
                            field.onChange(e.target.value.toUpperCase())
                          }
                        />
                      </FormControl>
                      <FormDescription>2-letter code</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Units */}
              <FormField
                control={form.control}
                name="units"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Units *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g., 250"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Total residential units in the property
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Property Type */}
              <FormField
                control={form.control}
                name="property_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Property Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select property type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Garden-Style">
                          Garden-Style
                        </SelectItem>
                        <SelectItem value="Mid-Rise">Mid-Rise</SelectItem>
                        <SelectItem value="High-Rise">High-Rise</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Equipment Type */}
              <FormField
                control={form.control}
                name="equipment_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Equipment Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="COMPACTOR">Compactor</SelectItem>
                        <SelectItem value="DUMPSTER">
                          Open Top (Dumpster)
                        </SelectItem>
                        <SelectItem value="MIXED">Both (Mixed)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Type of waste collection equipment
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Analysis Period */}
              <FormField
                control={form.control}
                name="analysis_period_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Analysis Period (months)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="12"
                        placeholder="6"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Number of months to analyze (1-12)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/projects")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Project
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
