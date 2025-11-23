# Running Both Skills Side-by-Side

## Two Separate Skills - No Conflicts!

You can now run both skills simultaneously without any conflicts:

### Skill 1: wastewise-analytics-validated (Your Current Skill)

**Name:** `wastewise-analytics-validated`
**Location:** `/mnt/skills/user/wastewise-analytics-validated/`
**What it does:** Standard WasteWise analysis with validation
**Sheets generated:** 6-7 sheets (no regulatory compliance)

### Skill 2: wastewise-regulatory (New Skill with Compliance)

**Name:** `wastewise-regulatory`
**Location:** Install to `/mnt/skills/user/wastewise-regulatory/`
**What it does:** Everything from Skill 1 PLUS automated regulatory research
**Sheets generated:** 7-8 sheets (includes REGULATORY_COMPLIANCE)

---

## How to Use Each Skill

### When to Use wastewise-analytics-validated (Old)

**Use for:**

- Quick analysis without regulatory research
- Properties where you already know the compliance requirements
- Rapid portfolio screening
- Standard monthly reviews
- When you just need cost analysis and optimization

**Example prompts:**

```
"Analyze invoices for Orion Prosper Lakes using wastewise-analytics-validated"

"Run standard WasteWise analysis on these 6 months of invoices"

"Quick analysis of Columbia Square Living without regulatory research"
```

**Output time:** ~1-2 minutes

---

### When to Use wastewise-regulatory (New)

**Use for:**

- New properties entering portfolio
- Compliance audits
- Due diligence for acquisitions
- Annual compliance reviews
- Development/construction projects
- Properties in unfamiliar jurisdictions
- When stakeholders need regulatory documentation

**Example prompts:**

```
"Analyze invoices for Orion Prosper Lakes using wastewise-regulatory"

"Run WasteWise analysis WITH regulatory compliance research for this property"

"I need full analysis including local ordinances for The Club at Millenia"

"Analyze these invoices and research Orlando waste regulations"
```

**Output time:** ~2-3 minutes (includes research)

---

## Side-by-Side Comparison

| Feature                         | wastewise-analytics-validated | wastewise-regulatory   |
| ------------------------------- | ----------------------------- | ---------------------- |
| Invoice analysis                | ✅ Yes                        | ✅ Yes                 |
| Contract extraction             | ✅ Yes                        | ✅ Yes                 |
| Optimization opportunities      | ✅ Yes                        | ✅ Yes                 |
| Haul log (compactor)            | ✅ Yes                        | ✅ Yes                 |
| Formula validation              | ✅ Yes                        | ✅ Yes                 |
| Quality check report            | ✅ Yes                        | ✅ Enhanced with judge |
| **Regulatory research**         | ❌ No                         | ✅ **Yes**             |
| **LLM Judge evaluation**        | ❌ No                         | ✅ **Yes**             |
| **REGULATORY_COMPLIANCE sheet** | ❌ No                         | ✅ **Yes**             |
| **Licensed haulers list**       | ❌ No                         | ✅ **Yes**             |
| **Compliance checklist**        | ❌ No                         | ✅ **Yes**             |
| Processing time                 | 1-2 min                       | 2-3 min                |
| Sheets generated                | 6-7                           | 7-8                    |

---

## Installation Instructions

### Step 1: Keep Your Current Skill (Don't Touch It!)

Your current skill stays exactly where it is:

```
/mnt/skills/user/wastewise-analytics-validated/
```

✅ **Do NOT delete or modify this folder**

### Step 2: Install the New Skill Alongside

1. Download: [wastewise-regulatory-new.zip](computer:///mnt/user-data/outputs/wastewise-regulatory-new.zip)

2. Extract the zip file

3. Copy the extracted folder to your skills directory:

   ```
   /mnt/skills/user/wastewise-regulatory/
   ```

4. You should now have TWO separate folders:
   ```
   /mnt/skills/user/
   ├── wastewise-analytics-validated/    (OLD - keeps working)
   └── wastewise-regulatory/              (NEW - with compliance)
   ```

### Step 3: Test Both Work

**Test the old skill:**

```
"Using wastewise-analytics-validated, analyze these invoices for [property]"
```

**Test the new skill:**

```
"Using wastewise-regulatory, analyze these invoices for [property] in [city, state]"
```

Both should work independently!

---

## Recommended Workflow

### Phase 1: Testing Period (2-4 weeks)

**For Critical/Production Work:**
Use `wastewise-analytics-validated` (your proven, trusted version)

**For Testing/Pilots:**
Use `wastewise-regulatory` on 5-10 properties to:

- Verify regulatory research accuracy
- Check judge decisions
- Compare outputs side-by-side

### Phase 2: Selective Use (1-3 months)

**Use wastewise-analytics-validated for:**

- Quick monthly reviews
- Properties you know well
- Speed-critical situations

**Use wastewise-regulatory for:**

- New acquisitions
- Compliance audits
- Development projects
- Unfamiliar jurisdictions

### Phase 3: Decision Point (After 3 months)

Once confident in wastewise-regulatory:

**Option A: Keep Both**

- Use old for speed
- Use new for compliance work
- Maximum flexibility

**Option B: Replace with New**

- Remove wastewise-analytics-validated
- Rename wastewise-regulatory to wastewise-analytics-validated
- Single unified solution

---

## Prompting Tips

### To Explicitly Choose a Skill:

**Be specific:**

```
"Use wastewise-regulatory to analyze..."
```

**Or mention what you want:**

```
"Analyze WITH regulatory compliance research"  → Uses wastewise-regulatory
"Quick analysis without ordinances"            → Uses wastewise-analytics-validated
```

### To Let Claude Choose:

Claude will automatically select the right skill based on your request:

**Triggers for wastewise-regulatory:**

- "regulatory compliance"
- "local ordinances"
- "research requirements"
- "licensed haulers"
- Mentions of city/location
- "compliance audit"

**Triggers for wastewise-analytics-validated:**

- "quick analysis"
- "standard review"
- "no compliance needed"
- "just the cost analysis"

---

## Troubleshooting

### Problem: Both skills trying to run

**Solution:** Be explicit in your prompt

```
❌ "Analyze these invoices"  (ambiguous)
✅ "Use wastewise-regulatory to analyze..."  (clear)
```

### Problem: Can't find wastewise-regulatory

**Check installation:**

```bash
ls /mnt/skills/user/
```

Should see both:

- wastewise-analytics-validated
- wastewise-regulatory

### Problem: Old skill suddenly doing regulatory research

**This shouldn't happen** - they're completely separate skills. If it does:

- Check the skill name in the folder
- Verify SKILL.md has correct name
- Restart Claude or reload skills

---

## Quick Reference Card

**Save this for easy reference:**

| I Want...               | Use This Skill                | Example Prompt                           |
| ----------------------- | ----------------------------- | ---------------------------------------- |
| Quick cost analysis     | wastewise-analytics-validated | "Quick analysis without compliance"      |
| Full compliance audit   | wastewise-regulatory          | "Analyze WITH regulatory research"       |
| New property evaluation | wastewise-regulatory          | "Full analysis for [property] in [city]" |
| Monthly review          | wastewise-analytics-validated | "Standard monthly review"                |
| Due diligence           | wastewise-regulatory          | "Research ordinances for [property]"     |
| Speed is critical       | wastewise-analytics-validated | "Fast analysis, no regulatory"           |

---

## Benefits of Running Side-by-Side

✅ **Safety:** Old proven version stays available
✅ **Testing:** Can compare outputs directly
✅ **Flexibility:** Choose right tool for each situation
✅ **Confidence:** Build trust in new version gradually
✅ **Rollback:** Easy to revert if needed
✅ **Learning:** See differences in real-world use

---

## When to Consolidate (Eventually)

Consolidate to single skill when:

- ✅ Tested wastewise-regulatory on 20+ properties
- ✅ Judge decisions consistently accurate (>95%)
- ✅ Team comfortable with new workflow
- ✅ No critical issues found
- ✅ Stakeholders trust the regulatory research

**Until then, keep both!** There's no downside to having both available.

---

## Support

**Questions about which skill to use?**

- Use `wastewise-analytics-validated` for familiar situations
- Use `wastewise-regulatory` when you need compliance info
- When in doubt, use `wastewise-regulatory` (it does everything)

**Having issues?**

- Check skill is properly installed
- Verify SKILL.md has correct name in frontmatter
- Be explicit in prompts about which skill to use
