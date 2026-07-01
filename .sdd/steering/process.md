# Process Rules

## Mandatory Validation

All SDD specification phases MUST go through validation before proceeding to implementation. Validation steps are NOT optional.

### Phase 1 — Specification (all mandatory)
1. `/sdd:spec-init "description"` — Initialize the spec
2. `/sdd:spec-requirements {feature}` — Define requirements → **requires human review**
3. `/sdd:validate-gap {feature}` — Gap analysis against existing codebase
4. `/sdd:spec-design {feature}` — Technical design → **requires human review**
5. `/sdd:validate-design {feature}` — Design review and validation
6. `/sdd:spec-tasks {feature}` — Task breakdown → **requires human review**

### Phase 2 — Implementation
1. `/sdd:spec-impl {feature} [tasks]` — Implement tasks
2. `/sdd:validate-impl {feature}` — Post-implementation validation → **mandatory**

### Rule
- No spec moves to implementation without passing all Phase 1 validation steps
- No implementation is considered complete without running `validate-impl`
- `-y` flags may only be used for intentional fast-track scenarios with explicit user direction
