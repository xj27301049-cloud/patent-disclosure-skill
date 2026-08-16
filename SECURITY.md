# Security Policy

## Overview

`patent-disclosure-skill` is an open-source AI Agent Skill project designed to support patent-related workflows, including technical disclosure organization, patent analysis, and document generation.

Because this project interacts with AI workflows and processes user-provided technical information, security and responsible usage are important parts of the project's long-term maintenance.

---

## Security Considerations

This project may process:

- User-provided technical documents
- AI-generated instructions and outputs
- Structured workflow definitions
- External information used for analysis

Potential security considerations include:

### Prompt Injection

External documents or user inputs may contain instructions designed to manipulate AI behavior or bypass intended workflows.

### Malicious Document Content

Uploaded files or referenced materials may contain unexpected instructions, unsafe content, or misleading information.

### Sensitive Information Exposure

Patent-related materials may contain confidential technical information. Users should avoid exposing sensitive information in unsafe environments.

### Tool and Automation Risks

Future extensions involving external tools, file operations, retrieval systems, or automation workflows may introduce additional security considerations.

### Dependency and Supply Chain Risks

Third-party dependencies, integrations, or community contributions may introduce vulnerabilities that require review.

---

## Secure Development Practices

The project aims to improve security through:

- Reviewing code changes before integration
- Maintaining transparent documentation
- Evaluating new automation capabilities carefully
- Monitoring dependency changes
- Improving workflow validation mechanisms

---

## Reporting Security Issues

If you discover a potential security vulnerability, please avoid publicly disclosing the issue immediately.

Report security concerns privately to the project maintainer with:

- A description of the issue
- Steps to reproduce the problem
- Potential impact
- Suggested mitigation if available

Security reports will be reviewed and addressed as part of ongoing project maintenance.

---

## Responsible Use

This project provides AI-assisted workflow capabilities.

Generated outputs should be reviewed by users before being used for professional, legal, or business decisions.

The project does not replace professional patent examination, legal review, or expert judgment.