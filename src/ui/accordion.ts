// Gemeinsame Stile fuer einklappbare Abschnitte (native <details>/<summary>).
// Als String exportiert, damit sowohl Light-DOM (PluginRegion) als auch
// Shadow-DOM (HelpPanel via unsafeCSS) denselben Look nutzen.
export const ACCORDION_CSS = `
.sac-accordion {
  background: var(--sac-color-surface);
  border: 1px solid var(--sac-color-border);
  border-radius: var(--sac-radius-md);
  overflow: hidden;
}
.sac-accordion + .sac-accordion {
  margin-top: var(--sac-space-3);
}
.sac-accordion > summary {
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--sac-space-2);
  padding: var(--sac-space-3);
  min-height: var(--sac-tap-target);
  box-sizing: border-box;
  font-weight: 600;
  font-size: 1rem;
  color: var(--sac-color-text);
}
.sac-accordion > summary::-webkit-details-marker {
  display: none;
}
.sac-accordion > summary .ac-icon {
  font-size: 1.1rem;
}
.sac-accordion > summary .ac-title {
  flex: 1;
}
.sac-accordion > summary::after {
  content: '\\25B8';
  color: var(--sac-color-muted);
  transition: transform var(--sac-motion-duration) ease;
}
.sac-accordion[open] > summary::after {
  transform: rotate(90deg);
}
.sac-accordion > summary:focus-visible {
  outline: var(--sac-focus-ring);
  outline-offset: -3px;
}
.sac-accordion .ac-body {
  padding: 0 var(--sac-space-3) var(--sac-space-3);
}
`;
