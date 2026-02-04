#!/bin/bash
# verify-survey.sh - Verify survey status and SOURCE-OF-TRUTH.md health
# Run this before starting work to ensure Claude has current knowledge

echo "==================================="
echo "  Survey Verification Check        "
echo "==================================="
echo ""

ISSUES=0

# Check for SOURCE-OF-TRUTH.md
if [ -f "SOURCE-OF-TRUTH.md" ]; then
    echo "✓ SOURCE-OF-TRUTH.md exists"
    
    # Check age
    if [ "$(uname)" = "Darwin" ]; then
        # macOS
        MODIFIED=$(stat -f %m SOURCE-OF-TRUTH.md)
        NOW=$(date +%s)
    else
        # Linux
        MODIFIED=$(stat -c %Y SOURCE-OF-TRUTH.md)
        NOW=$(date +%s)
    fi
    
    AGE_DAYS=$(( (NOW - MODIFIED) / 86400 ))
    
    if [ $AGE_DAYS -gt 7 ]; then
        echo "⚠ SOURCE-OF-TRUTH.md is $AGE_DAYS days old - consider re-running survey"
        ISSUES=$((ISSUES + 1))
    else
        echo "✓ SOURCE-OF-TRUTH.md is recent ($AGE_DAYS days old)"
    fi
    
    # Check for validation
    if grep -q "User validated: no\|PENDING" SOURCE-OF-TRUTH.md; then
        echo "⚠ SOURCE-OF-TRUTH.md has not been validated by user"
        ISSUES=$((ISSUES + 1))
    else
        echo "✓ SOURCE-OF-TRUTH.md appears to be validated"
    fi
    
else
    echo "✗ SOURCE-OF-TRUTH.md NOT FOUND"
    echo "  → Full survey required before proceeding"
    ISSUES=$((ISSUES + 1))
fi

echo ""

# Check for CLAUDE.md
if [ -f "CLAUDE.md" ]; then
    echo "✓ CLAUDE.md exists (supplementary project context)"
else
    echo "○ No CLAUDE.md found (optional)"
fi

# Check for survey workspace
if [ -d ".contractor-survey" ]; then
    echo "○ Survey workspace exists at .contractor-survey/"
    
    # Check for incomplete reports
    for report in structure connections operations state dependencies; do
        if [ -f ".contractor-survey/reports/${report}.md" ]; then
            if grep -q "Status: PENDING" ".contractor-survey/reports/${report}.md"; then
                echo "  ⚠ ${report}.md is incomplete"
                ISSUES=$((ISSUES + 1))
            fi
        fi
    done
fi

echo ""

# Check git status
if [ -d ".git" ]; then
    UNCOMMITTED=$(git status --porcelain | wc -l | tr -d ' ')
    if [ "$UNCOMMITTED" -gt 0 ]; then
        echo "⚠ $UNCOMMITTED uncommitted changes in repository"
        echo "  Consider committing or stashing before major work"
    else
        echo "✓ Git working tree is clean"
    fi
else
    echo "○ Not a git repository"
fi

echo ""
echo "==================================="

if [ $ISSUES -gt 0 ]; then
    echo "Found $ISSUES issue(s) - address before proceeding"
    exit 1
else
    echo "All checks passed - safe to proceed"
    exit 0
fi
