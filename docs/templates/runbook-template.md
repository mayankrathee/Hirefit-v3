# Runbook: [Operation Name]

## Overview

**Purpose**: [Brief description of what this runbook covers]
**When to Use**: [Circumstances that trigger this runbook]
**Estimated Duration**: [Time estimate]
**Skill Level**: [Beginner | Intermediate | Advanced]

---

## Prerequisites

### Access Requirements
- [ ] [System/Service] access with [role/permission]
- [ ] [Tool] installed and configured
- [ ] [Credentials/Keys] available

### Knowledge Requirements
- [ ] Familiarity with [technology/system]
- [ ] Understanding of [concept]

### Tools Needed
- [ ] Azure CLI / Portal access
- [ ] [Other tools]

---

## Quick Reference

| Item | Value |
|------|-------|
| Service URL | https://... |
| Dashboard | [Link] |
| Logs | [Link to Log Analytics query] |
| Escalation | [Contact/Channel] |

---

## Procedure

### Step 1: [Step Title]

**Purpose**: [Why this step is necessary]

```bash
# Command to execute
az [command] --param value
```

**Expected Output**:
```
[Expected output or success indicator]
```

**Verification**:
- [ ] [How to verify step completed successfully]

**If this fails**:
- Check [common issue]
- See [Troubleshooting section]

---

### Step 2: [Step Title]

**Purpose**: [Why this step is necessary]

1. Navigate to [location]
2. Click [button/link]
3. Enter [values]

**Screenshot**: [Include if helpful]

**Expected Result**: [What should happen]

**Verification**:
- [ ] [How to verify]

---

### Step 3: [Step Title]

[Continue pattern...]

---

## Verification

After completing all steps, verify success:

### Health Checks
- [ ] [Check 1] - Expected: [value]
- [ ] [Check 2] - Expected: [value]

### Functional Tests
- [ ] [Test 1]
- [ ] [Test 2]

### Monitoring
- [ ] Check [dashboard] for [metric]
- [ ] Verify no new alerts in [system]

---

## Rollback Procedure

If the operation needs to be reversed:

### Step 1: [Rollback Step]
```bash
# Rollback command
```

### Step 2: [Rollback Step]
[Instructions]

---

## Troubleshooting

### Issue: [Common Issue 1]

**Symptoms**:
- [Symptom 1]
- [Symptom 2]

**Cause**: [Root cause]

**Resolution**:
1. [Step 1]
2. [Step 2]

---

### Issue: [Common Issue 2]

**Symptoms**:
- [Symptom]

**Cause**: [Root cause]

**Resolution**:
1. [Step 1]

---

## Escalation

| Level | Contact | When |
|-------|---------|------|
| L1 | [Team/Slack channel] | [Trigger] |
| L2 | [On-call engineer] | [Trigger] |
| L3 | [Vendor support] | [Trigger] |

---

## Related Resources

- [Link to related documentation]
- [Link to dashboard]
- [Link to architecture diagram]

---

## Appendix

### A. Reference Commands

```bash
# Useful command 1
command --help

# Useful command 2
command --verbose
```

### B. Configuration Values

| Parameter | Production | Staging | Development |
|-----------|------------|---------|-------------|
| [Param] | [Value] | [Value] | [Value] |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | YYYY-MM-DD | [Author] | Initial version |

**Last Tested**: [Date]
**Next Review**: [Date]
**Owner**: [Team/Person]

