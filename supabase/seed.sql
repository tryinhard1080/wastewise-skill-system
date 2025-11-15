-- WasteWise Seed Data
-- Populates skills_config with canonical values

-- Seed skills configuration
insert into skills_config (skill_name, skill_version, conversion_rates, thresholds) values
('wastewise-analytics', '1.0.0',
  '{"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.0}'::jsonb,
  '{"compactor_tons": 6.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}'::jsonb),
('compactor-optimization', '1.0.0',
  '{"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.0}'::jsonb,
  '{"compactor_tons": 6.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}'::jsonb),
('contract-extractor', '1.0.0',
  '{"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.0}'::jsonb,
  '{"compactor_tons": 6.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}'::jsonb),
('regulatory-research', '1.0.0',
  '{"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.0}'::jsonb,
  '{"compactor_tons": 6.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}'::jsonb),
('batch-extractor', '1.0.0',
  '{"compactor_ypd": 14.49, "dumpster_ypd": 4.33, "target_capacity": 8.0}'::jsonb,
  '{"compactor_tons": 6.0, "contamination_pct": 3.0, "bulk_monthly": 500, "leaseup_variance": -40}'::jsonb);
