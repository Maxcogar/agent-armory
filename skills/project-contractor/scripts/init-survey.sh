#!/bin/bash
# init-survey.sh - Initialize the contractor survey workspace
# Run this at the start of any project survey

set -e

echo "==================================="
echo "  Project Contractor Survey Init   "
echo "==================================="
echo ""

# Create survey workspace
mkdir -p .contractor-survey/{reports,evidence}

# Initialize survey log
cat > .contractor-survey/survey.log << EOF
# Survey Log
Started: $(date)
Project: $(basename $(pwd))

## Status
- [ ] Structure Mapper complete
- [ ] Connection Tracer complete  
- [ ] Operations Validator complete
- [ ] State Analyzer complete
- [ ] Dependency Auditor complete
- [ ] Synthesis complete
- [ ] User validation complete

## Notes

EOF

# Create report templates
for report in structure connections operations state dependencies; do
    if [ ! -f ".contractor-survey/reports/${report}.md" ]; then
        echo "# ${report^} Report" > ".contractor-survey/reports/${report}.md"
        echo "Generated: $(date)" >> ".contractor-survey/reports/${report}.md"
        echo "Status: PENDING" >> ".contractor-survey/reports/${report}.md"
        echo "" >> ".contractor-survey/reports/${report}.md"
    fi
done

# Add to gitignore if not present
if [ -f ".gitignore" ]; then
    if ! grep -q ".contractor-survey" .gitignore; then
        echo "" >> .gitignore
        echo "# Contractor survey workspace (temporary)" >> .gitignore
        echo ".contractor-survey/" >> .gitignore
    fi
fi

echo "Survey workspace initialized at .contractor-survey/"
echo ""
echo "Next steps:"
echo "1. Deploy subagents for parallel analysis"
echo "2. Collect reports in .contractor-survey/reports/"
echo "3. Synthesize into SOURCE-OF-TRUTH.md"
echo "4. Get user validation"
echo ""
echo "See survey.log for progress tracking"
