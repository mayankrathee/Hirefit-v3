# AI Constraints & Guidelines - HireFit Talent Acquisition Platform

## Overview

This document defines the constraints, ethical guidelines, and operational boundaries for AI systems within the HireFit platform. All AI features must operate within these parameters to ensure fairness, transparency, and compliance with emerging AI regulations.

---

## 1. AI System Classification

### 1.1 High-Risk AI Applications (EU AI Act Classification)

The following AI features are classified as **high-risk** under the EU AI Act:

| Feature | Risk Level | Regulatory Requirements |
|---------|------------|------------------------|
| Resume Screening & Scoring | High | Full compliance package |
| Candidate Ranking | High | Full compliance package |
| Skills Assessment Scoring | High | Full compliance package |
| Interview Question Generation | Medium | Transparency requirements |
| Job Description Optimization | Low | Basic documentation |

### 1.2 Compliance Requirements for High-Risk AI

1. **Risk Management System**: Continuous risk identification and mitigation
2. **Data Governance**: High-quality, representative training data
3. **Technical Documentation**: Complete system documentation
4. **Record Keeping**: Automatic logging of all decisions
5. **Transparency**: Clear information to users about AI involvement
6. **Human Oversight**: Meaningful human control over decisions
7. **Accuracy & Robustness**: Performance monitoring and error handling
8. **Cybersecurity**: Protection against adversarial attacks

---

## 2. Ethical AI Principles

### 2.1 Core Principles

#### Fairness
- AI systems must not discriminate based on protected characteristics
- Regular bias testing across demographic groups
- Disparate impact monitoring with defined thresholds
- Remediation procedures for identified bias

#### Transparency
- Candidates must be informed when AI is used in evaluation
- Decision factors must be explainable in human terms
- AI confidence levels must be communicated to reviewers
- Model limitations clearly documented

#### Accountability
- Human decision-makers remain ultimately responsible
- Clear escalation paths for AI-flagged concerns
- Audit trails for all AI-influenced decisions
- Defined ownership for AI system performance

#### Privacy
- Minimum necessary data collection
- Purpose limitation for AI training data
- Candidate control over AI processing
- No use of social media scraping or surveillance

### 2.2 Prohibited Uses

The following AI applications are **explicitly prohibited**:

1. **Emotion Recognition**: No facial expression or voice sentiment analysis for hiring decisions
2. **Social Scoring**: No aggregation of social media or public behavior data
3. **Biometric Categorization**: No inferring protected characteristics from biometric data
4. **Predictive Behavioral Analysis**: No prediction of personal behavior outside job context
5. **Subliminal Manipulation**: No techniques that manipulate candidates unconsciously
6. **Exploitation of Vulnerabilities**: No targeting of candidate vulnerabilities

---

## 3. Bias Prevention Framework

### 3.1 Protected Characteristics

AI systems must be monitored for bias related to:

- Race and ethnicity
- Gender and gender identity
- Age
- Disability status
- National origin
- Religion
- Veteran status
- Sexual orientation
- Pregnancy status
- Genetic information

### 3.2 Bias Testing Requirements

#### Pre-Deployment Testing
- Demographic parity analysis
- Equalized odds assessment
- Calibration across groups
- Disparate impact ratio calculation (4/5ths rule)

#### Ongoing Monitoring
- Weekly automated bias scans
- Monthly detailed analysis
- Quarterly third-party audits (for NYC LL144 compliance)
- Annual comprehensive review

### 3.3 Bias Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Disparate Impact Ratio | < 0.8 | Immediate review, potential suspension |
| Selection Rate Difference | > 10% | Investigation required |
| Score Distribution Variance | > 15% | Model recalibration |
| False Positive Rate Difference | > 5% | Algorithm adjustment |

### 3.4 Remediation Procedures

1. **Detection**: Automated monitoring flags potential bias
2. **Investigation**: Data science team analyzes root cause
3. **Mitigation**: Implement algorithmic adjustments or feature removal
4. **Validation**: Re-test to confirm resolution
5. **Documentation**: Record findings and actions taken
6. **Communication**: Notify affected stakeholders if required

---

## 4. Human Oversight Requirements

### 4.1 Human-in-the-Loop (HITL) Mandates

| Decision Type | HITL Requirement | Override Capability |
|---------------|------------------|---------------------|
| Resume rejection | Required for all rejections | Full override |
| Candidate ranking | Advisory only, human review | Full override |
| Interview scoring | AI assists, human decides | Full override |
| Offer recommendations | Advisory only | Full override |
| Background flags | Human review mandatory | Full override |

### 4.2 Reviewer Qualifications

- Trained on AI system capabilities and limitations
- Understanding of bias risks and mitigation
- Authority to override AI recommendations
- Regular recertification (annual)

### 4.3 Override Documentation

All AI overrides must capture:
- Original AI recommendation
- Human decision
- Reasoning for override
- Reviewer identity and timestamp

---

## 5. Data Requirements

### 5.1 Training Data Standards

#### Quality Requirements
- Minimum sample sizes per demographic group
- Representative distribution across job types
- Regular data freshness audits
- Labeling quality verification

#### Prohibited Data Sources
- Scraped social media data
- Purchased demographic data
- Historical data with known bias
- Data from discriminatory sources

#### Data Documentation
- Data provenance tracking
- Collection methodology
- Known limitations and gaps
- Preprocessing steps

### 5.2 Inference Data Handling

#### Input Validation
- Schema validation for all inputs
- Anomaly detection for unusual patterns
- Rejection of malformed data
- PII masking where possible

#### Output Constraints
- Confidence score requirements (minimum threshold for action)
- Uncertainty quantification
- Graceful degradation for edge cases
- Fallback to human review when uncertain

---

## 6. Model Governance

### 6.1 Model Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Design    │───▶│   Develop   │───▶│   Deploy    │───▶│   Monitor   │
│             │    │             │    │             │    │             │
│ - Use case  │    │ - Training  │    │ - Staging   │    │ - Metrics   │
│ - Data req  │    │ - Testing   │    │ - Canary    │    │ - Drift     │
│ - Fairness  │    │ - Bias eval │    │ - Rollout   │    │ - Bias      │
│   criteria  │    │ - Review    │    │ - A/B test  │    │ - Feedback  │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │                                                        │
       │                    ┌─────────────┐                     │
       └────────────────────│   Retire    │◀────────────────────┘
                            │             │
                            │ - Archive   │
                            │ - Document  │
                            │ - Transition│
                            └─────────────┘
```

### 6.2 Model Registry Requirements

Each model must include:
- Unique identifier and version
- Training data summary
- Performance metrics
- Bias evaluation results
- Deployment history
- Owner and approvers
- Expiration date

### 6.3 Change Management

| Change Type | Approval Required | Testing Required |
|-------------|-------------------|------------------|
| Hyperparameter tuning | Team lead | Standard suite |
| Feature addition | Product + Data Science | Full bias testing |
| Architecture change | Leadership | Full validation |
| Training data update | Data Science lead | Bias retesting |

---

## 7. Microsoft Foundry Integration

### 7.1 Agent Design Principles

When building AI agents with Microsoft Foundry:

1. **Single Responsibility**: Each agent handles one specific task
2. **Stateless Processing**: No persistent memory between sessions
3. **Auditable Actions**: All agent actions logged
4. **Bounded Autonomy**: Defined action space with hard limits
5. **Graceful Failure**: Clear error handling and fallback

### 7.2 Agent Constraints

```yaml
agent_constraints:
  max_iterations: 10
  timeout_seconds: 30
  allowed_actions:
    - read_candidate_profile
    - score_resume
    - generate_questions
    - summarize_evaluation
  prohibited_actions:
    - modify_candidate_data
    - send_communications
    - make_final_decisions
    - access_compensation_data
  required_outputs:
    - confidence_score
    - reasoning_trace
    - data_sources_used
```

### 7.3 Prompt Engineering Standards

- Use system prompts to enforce constraints
- Include bias mitigation instructions
- Require structured output formats
- Implement prompt injection defenses
- Version control all prompts

---

## 8. Explainability Requirements

### 8.1 Explanation Levels

| Audience | Detail Level | Format |
|----------|--------------|--------|
| Candidate | High-level factors | Natural language summary |
| Recruiter | Key scoring factors | Structured breakdown |
| Hiring Manager | Decision factors with weights | Visual + detailed text |
| Auditor | Full technical trace | Complete log with model details |

### 8.2 Required Explanations

For each AI-influenced decision:
- Top contributing factors (positive and negative)
- Confidence level and uncertainty
- Data sources used
- Comparison to role requirements
- Limitations and caveats

### 8.3 Explanation Generation

```
Input: Candidate Profile + Job Requirements
     │
     ▼
┌─────────────────────────────────────┐
│         AI Scoring Engine           │
│  ┌─────────────────────────────┐    │
│  │  Feature Extraction         │    │
│  │  ├─ Skills matching         │    │
│  │  ├─ Experience relevance    │    │
│  │  ├─ Education alignment     │    │
│  │  └─ Certification check     │    │
│  └─────────────────────────────┘    │
│              │                       │
│              ▼                       │
│  ┌─────────────────────────────┐    │
│  │  Scoring & Explanation      │    │
│  │  ├─ Generate score          │    │
│  │  ├─ Calculate confidence    │    │
│  │  ├─ Extract top factors     │    │
│  │  └─ Generate explanation    │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
     │
     ▼
Output: Score + Confidence + Explanation
```

---

## 9. Performance Requirements

### 9.1 Accuracy Targets

| Metric | Target | Minimum |
|--------|--------|---------|
| Precision (qualified candidates) | 85% | 80% |
| Recall (qualified candidates) | 80% | 75% |
| AUC-ROC | 0.85 | 0.80 |
| Inter-rater reliability (vs human) | 0.80 | 0.75 |

### 9.2 Latency Requirements

| Operation | Target | Maximum |
|-----------|--------|---------|
| Resume scoring | < 5s | 15s |
| Candidate ranking | < 10s | 30s |
| Question generation | < 3s | 10s |
| Explanation generation | < 2s | 5s |

### 9.3 Reliability Requirements

- Availability: 99.9% uptime
- Error rate: < 0.1% of requests
- Graceful degradation when AI unavailable
- Automatic fallback to rule-based scoring

---

## 10. Monitoring & Alerting

### 10.1 Key Metrics

**Performance Metrics**:
- Prediction accuracy over time
- Latency percentiles (p50, p95, p99)
- Error rates by type
- Throughput and capacity

**Fairness Metrics**:
- Demographic parity by group
- Selection rates by group
- Score distributions
- Override rates by reviewer

**Operational Metrics**:
- Model version distribution
- Feature drift detection
- Data quality scores
- Human review queue depth

### 10.2 Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Accuracy drop | 5% decrease | 10% decrease |
| Latency increase | 2x baseline | 5x baseline |
| Bias metric | 0.85 ratio | 0.80 ratio |
| Error rate | 0.5% | 1.0% |

---

## 11. Documentation Requirements

### 11.1 Technical Documentation

- System architecture and data flows
- Model cards for each AI model
- API specifications
- Integration guides
- Troubleshooting guides

### 11.2 Compliance Documentation

- Risk assessments
- Bias audit reports
- Data processing records
- Incident reports
- Change logs

### 11.3 User Documentation

- AI feature descriptions
- Interpretation guides
- Override procedures
- Feedback mechanisms

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-01-XX | HireFit Team | Initial draft |

**Review Schedule**: Quarterly
**Next Review**: Q2 2024
**Regulatory Updates**: Monitor EU AI Act, NYC LL144, state laws

