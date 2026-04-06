# Skeuomorphism Design System

The CMDB Health Doctor portal looks like a physical control room monitoring panel. Dark metallic background, tactile cards with real depth, analog-style gauges, physical LED status indicators, embossed text and buttons.

## Color Palette

```scss
// Background — dark brushed steel
$bg-deep:        #0d0d1a;
$bg-panel:       #16213e;
$bg-card:        #1a1a2e;
$bg-card-light:  #0f3460;

// Status colors — physical LED style
$critical-color: #e53935;
$critical-glow:  rgba(229, 57, 53, 0.6);
$moderate-color: #fb8c00;
$moderate-glow:  rgba(251, 140, 0, 0.5);
$minor-color:    #fdd835;
$minor-glow:     rgba(253, 216, 53, 0.4);
$healthy-color:  #43a047;
$healthy-glow:   rgba(67, 160, 71, 0.5);

// Metallic accents
$metal-light:    #c0c8d8;
$metal-mid:      #8892a4;
$metal-dark:     #4a5568;
$accent-blue:    #4fc3f7;
$accent-glow:    rgba(79, 195, 247, 0.3);

// Text
$text-primary:   #e8eaf6;
$text-secondary: #9fa8da;
$text-muted:     #546e7a;
```

## CSS Patterns

### Metallic Panel Background

```scss
background: linear-gradient(145deg, #1e2a4a 0%, #0d1525 50%, #1a2035 100%);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -1px 0 rgba(0,0,0,0.4),
            0 8px 32px rgba(0,0,0,0.6);
```

### Embossed Card Surface

```scss
background: linear-gradient(145deg, #1e2847 0%, #141d35 100%);
border: 1px solid rgba(255,255,255,0.06);
box-shadow: 0 2px 4px rgba(0,0,0,0.4),
            0 8px 24px rgba(0,0,0,0.3),
            inset 0 1px 0 rgba(255,255,255,0.08);
border-radius: 12px;
```

### Physical LED Status Indicators

```scss
// Critical LED
.led-critical {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ff6b6b, #c0392b);
  box-shadow: 0 0 6px #e53935, 0 0 12px rgba(229,57,53,0.6),
              inset 0 1px 2px rgba(255,255,255,0.3);
}

// Moderate LED — swap colors to #fb8c00
// Minor LED    — swap colors to #fdd835
// Healthy LED  — swap colors to #43a047
```

### Pressed/Active Button

```scss
.btn-skeuo {
  background: linear-gradient(145deg, #1a2540, #0d1525);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 4px 8px rgba(0,0,0,0.4),
              inset 0 1px 0 rgba(255,255,255,0.08);
  &:active {
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5),
                0 1px 2px rgba(0,0,0,0.3);
    transform: translateY(1px);
  }
}
```

### Score Progress Bar (Analog Meter Style)

```scss
.score-track {
  background: linear-gradient(90deg, #0a0f1e, #111827);
  border: 1px solid rgba(255,255,255,0.05);
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.6),
              inset 0 -1px 0 rgba(255,255,255,0.03);
  border-radius: 4px; height: 8px;
}
.score-fill {
  border-radius: 4px; height: 100%;
  box-shadow: 0 0 8px currentColor;
  transition: width 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Left Status Stripe on Cards

```scss
.card-stripe-critical {
  border-left: 4px solid $critical-color;
  box-shadow: -2px 0 12px $critical-glow;
}
// Repeat for moderate / minor / healthy using their respective vars
```

### Scan Line Texture Overlay (Control Room Effect)

```scss
.scanlines::after {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0,0,0,0.03) 2px,
    rgba(0,0,0,0.03) 4px
  );
  pointer-events: none;
}
```

### Filter Status Pills

```scss
.filter-pills { display: flex; gap: 8px; flex-wrap: wrap; }

.filter-pill {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.1);
  background: linear-gradient(145deg, #1a2540, #0d1525);
  color: #9fa8da;
  box-shadow: 0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.06);
  transition: all 0.2s ease;
}
.filter-pill:hover { color: #e8eaf6; border-color: rgba(255,255,255,0.2); }

/* Active pill — inset "pressed" state with status glow */
.filter-pill.active-all      { background: #0f3460; color: #4fc3f7; border-color: rgba(79,195,247,0.4); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(79,195,247,0.2); }
.filter-pill.active-critical { background: rgba(229,57,53,0.15); color: #e53935; border-color: rgba(229,57,53,0.5); box-shadow: inset 0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(229,57,53,0.2); }
.filter-pill.active-moderate { background: rgba(251,140,0,0.15);  color: #fb8c00; border-color: rgba(251,140,0,0.5);  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(251,140,0,0.2); }
.filter-pill.active-minor    { background: rgba(253,216,53,0.12);  color: #fdd835; border-color: rgba(253,216,53,0.4);  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(253,216,53,0.15); }
.filter-pill.active-healthy  { background: rgba(67,160,71,0.15);   color: #43a047; border-color: rgba(67,160,71,0.5);   box-shadow: inset 0 2px 4px rgba(0,0,0,0.5), 0 0 8px rgba(67,160,71,0.2); }
```

### CI Card Hover State and Expand Transition

```scss
.ci-card {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  position: relative;
  overflow: hidden;
}
.ci-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.5),
              0 12px 32px rgba(0,0,0,0.4),
              inset 0 1px 0 rgba(255,255,255,0.1);
}
.ci-card.expanded {
  /* selected/active state — slight inset */
  transform: translateY(0);
  box-shadow: inset 0 2px 6px rgba(0,0,0,0.5),
              0 2px 8px rgba(0,0,0,0.4);
}

/* Expanded detail panel — slides in below the card row */
.detail-panel {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
  opacity: 0;
}
.detail-panel.open {
  max-height: 800px;
  opacity: 1;
}
```

### Accordion Section (inside Detail Panel)

```scss
.accordion-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  border-radius: 8px;
  background: linear-gradient(145deg, #1a2540, #0d1525);
  border: 1px solid rgba(255,255,255,0.07);
  box-shadow: 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05);
  user-select: none;
  transition: background 0.2s ease;
}
.accordion-header:hover { background: linear-gradient(145deg, #1e2a4a, #111827); }
.accordion-header .chevron {
  font-size: 10px;
  color: #546e7a;
  transition: transform 0.25s ease;
}
.accordion-header.open .chevron { transform: rotate(180deg); }

.accordion-body {
  overflow: hidden;
  max-height: 0;
  transition: max-height 0.3s ease, padding 0.2s ease;
  padding: 0 16px;
}
.accordion-body.open { max-height: 400px; padding: 12px 16px; }
```

### Modal Backdrop and Dialog

```scss
.modal-backdrop {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.75);
  backdrop-filter: blur(3px);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-dialog {
  background: linear-gradient(145deg, #1e2847 0%, #141d35 100%);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 4px 16px rgba(0,0,0,0.6),
              0 24px 64px rgba(0,0,0,0.5),
              inset 0 1px 0 rgba(255,255,255,0.08);
  border-radius: 16px;
  padding: 32px;
  width: 100%;
  max-width: 460px;
}
```

### Toast Notification

```scss
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  padding: 14px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  z-index: 9999;
  box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  transition: opacity 0.3s ease, transform 0.3s ease;
}
.toast-success {
  background: rgba(67,160,71,0.2);
  border: 1px solid rgba(67,160,71,0.5);
  color: #43a047;
}
.toast-error {
  background: rgba(229,57,53,0.2);
  border: 1px solid rgba(229,57,53,0.5);
  color: #e53935;
}
```

### AI Summary Terminal Readout

```scss
.terminal-readout {
  font-family: 'Courier New', Courier, monospace;
  font-size: 12px;
  line-height: 1.7;
  color: #4fc3f7;
  background: #030712;
  border: 1px solid rgba(79,195,247,0.2);
  border-radius: 8px;
  padding: 16px;
  box-shadow: inset 0 2px 8px rgba(0,0,0,0.8),
              0 0 16px rgba(79,195,247,0.05);
  white-space: pre-wrap;
  word-break: break-word;
}
/* Blinking cursor at end of readout */
.terminal-readout::after {
  content: '█';
  animation: blink 1s step-end infinite;
  opacity: 0.7;
}
@keyframes blink {
  50% { opacity: 0; }
}
```

### Issue Badge Pills (on CI Cards)

```scss
.badge-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.07em;
  text-transform: uppercase;
}
.badge-stale     { background: rgba(84,110,122,0.3);  color: #8892a4; border: 1px solid rgba(84,110,122,0.4); }
.badge-orphan    { background: rgba(79,195,247,0.15);  color: #4fc3f7; border: 1px solid rgba(79,195,247,0.3); }
.badge-duplicate { background: rgba(251,140,0,0.15);   color: #fb8c00; border: 1px solid rgba(251,140,0,0.3); }
.badge-violation { background: rgba(229,57,53,0.15);   color: #e53935; border: 1px solid rgba(229,57,53,0.3); }
.badge-missing   { background: rgba(253,216,53,0.12);  color: #fdd835; border: 1px solid rgba(253,216,53,0.3); }
```

### Header Summary Count Cards

```scss
.summary-count-card {
  text-align: center;
  padding: 16px 24px;
  border-radius: 12px;
  background: linear-gradient(145deg, #1e2847 0%, #141d35 100%);
  border: 1px solid rgba(255,255,255,0.06);
  box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07);
  min-width: 90px;
}
.summary-count-card .count-number {
  font-size: 32px;
  font-weight: 700;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
.summary-count-card .count-label {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #546e7a;
  margin-top: 4px;
}
/* Per-status color on the number */
.count-total    { color: #4fc3f7; }
.count-critical { color: #e53935; }
.count-moderate { color: #fb8c00; }
.count-minor    { color: #fdd835; }
.count-healthy  { color: #43a047; }
```

### Pulsing Alert Dot (Critical indicator in header)

```scss
@keyframes pulse-ring {
  0%   { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(229,57,53,0.7); }
  70%  { transform: scale(1);   box-shadow: 0 0 0 10px rgba(229,57,53,0); }
  100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(229,57,53,0); }
}
.alert-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #e53935;
  animation: pulse-ring 1.5s ease-out infinite;
  display: inline-block;
  margin-right: 6px;
}
```
