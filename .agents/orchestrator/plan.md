# Orchestrator Plan — Receipt Structure Verification

## Objectives
Verify that the receipt structure in the codebase matches the preview exactly:
- Check `src/index.css` to confirm that `@page { size: A4 portrait; margin: 0; }` is active.
- Check `src/components/OrderPreviewModal.tsx` to confirm that the "Download PDF" button correctly bypasses browser printing.

## Plan Steps
1. **Initialize Project Infrastructure**: Create/overwrite plan.md, progress.md, briefing.md, and scope.md.
2. **Setup Heartbeat Cron**: Done (scheduled for periodic checks).
3. **M1: Codebase Audit & Exploration**:
   - Spawn 3 Explorer agents in parallel to inspect `src/index.css` and `src/components/OrderPreviewModal.tsx` and verify requirements.
   - Wait for reports, aggregate findings, and verify details.
4. **M2: Quality Gate & Forensic Audit**:
   - Spawn 2 Reviewers to review findings and check correctness.
   - Spawn 2 Challengers to verify download PDF behavior or print config.
   - Spawn Forensic Auditor to verify integrity and ensure no cheats/bypasses.
   - Collect verdicts and check gate criteria.
5. **Final Presentation**: Synthesize findings and present results to the user.
