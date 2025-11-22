#!/bin/bash

# Fix types in users/route.ts
sed -i 's/userIds = authUsers\.users\.map(u => u\.id)/userIds = authUsers.users.map((u: any) => u.id)/g' app/api/admin/users/route.ts
sed -i 's/authUsers\.users\.map(user =>/authUsers.users.map((user: any) =>/g' app/api/admin/users/route.ts
sed -i 's/roles\?\.find(r => r\.user_id/roles?.find((r: any) => r.user_id/g' app/api/admin/users/route.ts
sed -i 's/statuses\?\.find(s => s\.user_id/statuses?.find((s: any) => s.user_id/g' app/api/admin/users/route.ts
sed -i 's/projectCounts\?\.filter(p => p\.user_id/projectCounts?.filter((p: any) => p.user_id/g' app/api/admin/users/route.ts
sed -i 's/users\.filter(u =>/users.filter((u: any) =>/g' app/api/admin/users/route.ts

# Fix types in jobs routes
sed -i 's/(data || \[\])\.map(async (job) =>/(data || []).map(async (job: any) =>/g' app/api/admin/jobs/route.ts
sed -i 's/\.filter(j => j\.status/.filter((j: any) => j.status/g' app/api/admin/jobs/stats/route.ts
sed -i 's/\.reduce((sum, job) =>/.reduce((sum: number, job: any) =>/g' app/api/admin/jobs/stats/route.ts
sed -i 's/\.reduce((acc, job) =>/.reduce((acc: Record<string, number>, job: any) =>/g' app/api/admin/jobs/stats/route.ts

# Fix types in metrics route
sed -i 's/activeJobs\?\.map(j => j\.user_id)/activeJobs?.map((j: any) => j.user_id)/g' app/api/admin/system/metrics/route.ts
sed -i 's/jobs\?\.filter(j => j\.status/jobs?.filter((j: any) => j.status/g' app/api/admin/system/metrics/route.ts
sed -i 's/jobs\?\.reduce((acc, job) =>/jobs?.reduce((acc: any, job: any) =>/g' app/api/admin/system/metrics/route.ts
sed -i 's/files\?\.reduce((sum, f) =>/files?.reduce((sum: number, f: any) =>/g' app/api/admin/system/metrics/route.ts
sed -i 's/projects\?\.filter(p => p\.status/projects?.filter((p: any) => p.status/g' app/api/admin/system/metrics/route.ts

