# Incident Report: [INC-XXXX] [Brief Title]

## Incident Summary

| Field | Value |
|-------|-------|
| **Incident ID** | INC-XXXX |
| **Severity** | Critical / High / Medium / Low |
| **Status** | Open / Investigating / Resolved / Closed |
| **Start Time** | YYYY-MM-DD HH:MM UTC |
| **End Time** | YYYY-MM-DD HH:MM UTC |
| **Duration** | X hours Y minutes |
| **Affected Services** | [List services] |
| **Affected Customers** | X tenants / Y users |
| **Incident Commander** | [Name] |

---

## Executive Summary

[2-3 paragraph summary suitable for stakeholder communication. Include what happened, impact, resolution, and key follow-up actions.]

---

## Timeline

| Time (UTC) | Event |
|------------|-------|
| HH:MM | [Event description] |
| HH:MM | [Event description] |
| HH:MM | Alert triggered: [Alert name] |
| HH:MM | Incident declared, IC assigned |
| HH:MM | [Event description] |
| HH:MM | Root cause identified |
| HH:MM | Fix deployed |
| HH:MM | Service restored |
| HH:MM | Incident resolved |

---

## Impact Assessment

### Customer Impact
- **Number of affected customers**: X
- **Geographic regions**: [Regions]
- **Features affected**: [List features]
- **Data impact**: None / Data loss / Data corruption

### Business Impact
- **Revenue impact**: $X estimated
- **SLA breach**: Yes / No
- **Customer communications sent**: Yes / No

### Technical Impact
- **Services degraded**: [List]
- **Error rates**: X% (normal: Y%)
- **Latency increase**: Xms (normal: Yms)

---

## Root Cause Analysis

### What Happened

[Detailed technical description of what went wrong]

### Why It Happened

[Root cause analysis - can use 5 Whys or other method]

**Contributing Factors**:
1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

### Detection

**How was the incident detected?**
- [ ] Automated monitoring/alerting
- [ ] Customer report
- [ ] Internal user report
- [ ] Other: [specify]

**Time to detect**: X minutes from start

---

## Resolution

### Immediate Actions Taken

1. [Action 1]
2. [Action 2]
3. [Action 3]

### Fix Applied

[Description of the fix that resolved the incident]

```bash
# Commands or code changes if applicable
```

### Verification

[How was resolution verified?]

---

## Follow-up Actions

### Immediate (Within 24 hours)

| # | Action | Owner | Status | Due Date |
|---|--------|-------|--------|----------|
| 1 | [Action] | [Name] | [ ] | YYYY-MM-DD |
| 2 | [Action] | [Name] | [ ] | YYYY-MM-DD |

### Short-term (Within 1 week)

| # | Action | Owner | Status | Due Date |
|---|--------|-------|--------|----------|
| 1 | [Action] | [Name] | [ ] | YYYY-MM-DD |
| 2 | [Action] | [Name] | [ ] | YYYY-MM-DD |

### Long-term (Within 1 month)

| # | Action | Owner | Status | Due Date |
|---|--------|-------|--------|----------|
| 1 | [Action] | [Name] | [ ] | YYYY-MM-DD |
| 2 | [Action] | [Name] | [ ] | YYYY-MM-DD |

---

## Prevention

### What Could Have Prevented This?

1. [Prevention measure 1]
2. [Prevention measure 2]

### Monitoring Improvements

- [ ] Add alert for [condition]
- [ ] Improve dashboard for [visibility]
- [ ] Add runbook for [scenario]

### Process Improvements

- [ ] [Process change]
- [ ] [Training needed]

---

## Lessons Learned

### What Went Well

- [Positive aspect 1]
- [Positive aspect 2]

### What Could Be Improved

- [Improvement area 1]
- [Improvement area 2]

### Questions for Review

1. [Question to discuss]
2. [Question to discuss]

---

## Supporting Information

### Related Tickets

- [JIRA-XXX] - [Description]
- [JIRA-XXX] - [Description]

### Logs and Evidence

- [Link to log query]
- [Link to dashboard snapshot]
- [Link to relevant alerts]

### Communication

- [Link to status page update]
- [Link to customer communication]

---

## Appendix

### A. Alert Details

```
Alert Name: [Name]
Triggered: [Time]
Query: [Query]
Threshold: [Value]
```

### B. Error Logs

```
[Relevant log snippets]
```

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | YYYY-MM-DD | [Author] | Initial report |
| 1.1 | YYYY-MM-DD | [Author] | Added follow-up actions |

**Review Date**: [Date]
**Reviewers**: [Names]
**Approved By**: [Name]

