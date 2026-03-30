# Prompt for Claude Chat — Create Beautiful HTML Documentation

## HOW TO USE THIS FILE

1. Open the file named GUIDE.md in this project
2. Select All (Cmd+A) and Copy (Cmd+C) the entire contents
3. Open Claude Chat (claude.ai)
4. Paste the prompt below FIRST, then paste the entire GUIDE.md contents after it
5. Send the message
6. Claude Chat will return a complete single HTML file
7. Save that HTML file and open it in any browser

---

## THE PROMPT TO SEND TO CLAUDE CHAT

Copy everything between the dashed lines below and paste it into Claude Chat,
then immediately follow it with the full contents of GUIDE.md:

---

I have a raw technical documentation draft that I will paste below this prompt.
Please transform it into a beautifully formatted, professional HTML documentation
page. Here are the exact design requirements:

TYPOGRAPHY:
- Primary font: Inter or Segoe UI for body text, loaded from Google Fonts if possible
- Monospace font: JetBrains Mono or Fira Code for all code blocks, commands, and file paths
- H1 headings: large, bold, with a colored left accent bar
- H2 headings: medium weight, with a subtle bottom border
- H3 headings: slightly larger than body, colored in the primary accent color
- Body text: 16px, line height 1.7, comfortable reading width (max 860px)
- Section numbers: large, bold, displayed prominently before each section title

COLOR SCHEME:
- Page background: #f8f9fa (very light gray)
- Content area background: #ffffff (white)
- Primary accent (headings, borders): #1a3a5c (deep navy blue)
- Secondary accent (links, highlights): #0d7377 (teal)
- Code block background: #1e1e1e (dark, VS Code style)
- Code block text: #d4d4d4 (light gray)
- Tip box: left border #2e7d32 (green), background #f1f8e9
- Warning box: left border #f57c00 (amber), background #fff8e1
- Critical/danger box: left border #c62828 (red), background #ffebee
- Info box: left border #0d7377 (teal), background #e0f7fa
- Prompt box: left border #6a1b9a (purple), background #f3e5f5
- Table header background: #1a3a5c, text white
- Table alternating rows: white and #f5f7fa

LAYOUT:
- Sticky navigation sidebar on the left showing all section links
- Main content area on the right with comfortable padding
- On smaller screens (mobile), sidebar collapses to a top menu
- Maximum content width: 860px centered in the main area
- Generous whitespace between sections (margin-top: 60px per major section)

HEADER:
- Full-width hero banner at the top with deep navy background (#1a3a5c)
- Document title in large white bold text
- Subtitle: "A Complete Step-by-Step Guide for Beginners"
- Three metadata pills showing: Version 1.0 | ServiceNow SDK 4.4.1 | March 2026
- A subtle geometric pattern or gradient overlay on the banner

TABLE OF CONTENTS:
- Sticky left sidebar listing all Section titles with their numbers
- Active section highlighted as user scrolls
- Smooth scroll behavior when clicking links
- Collapsible on mobile

SECTION HEADERS:
- Each major section (SECTION 0 through SECTION 13 and APPENDIX sections) gets a
  styled header block with: section number in large muted text, section title bold,
  and a full-width colored divider line below
- Use emoji icons before each section title exactly as listed here:
  Section 0: Overview icon
  Section 1: Tools/wrench icon
  Section 2: Link/connection icon
  Section 3: Folder/project icon
  Section 4: Structure/tree icon
  Section 5: Robot/AI icon
  Section 6: Brain/skill icon
  Section 7: Book/reference icon
  Section 8: Code/build icon
  Section 9: Rocket/deploy icon
  Section 10: Settings/gear icon
  Section 11: Architecture/design icon
  Section 12: Warning/tips icon
  Section 13: Cycle/summary icon

SPECIAL CALLOUT BOXES:
Create visually distinct styled boxes for these patterns in the content:
- Any paragraph starting with "What it does:" → teal info box
- Any paragraph starting with "When to use it:" → blue info box
- Any paragraph starting with "Important:" or "Warning:" → amber warning box
- Any paragraph starting with "STRICT REQUIREMENT:" → red critical box
- Any section labeled as a "Prompt" or "Prompt to" → purple prompt box with a
  header badge that says "CLAUDE CODE PROMPT" in white on purple background

PROMPT BOXES (most important styling):
The prompts throughout this document (the multi-line instructions in code blocks
under sections starting with "Prompt") must be displayed as special styled containers:
- Purple left border (4px solid #6a1b9a)
- Light purple background (#f3e5f5)
- A badge at the top-left that says "CLAUDE CODE PROMPT" in white on #6a1b9a
- The actual prompt text inside a dark-background code block (#1e1e1e)
- A "Copy to clipboard" button in the top-right corner of the code block
- The copy button should actually work using the Clipboard API in JavaScript

CODE BLOCKS AND COMMANDS:
- All inline code: slightly rounded, light gray background, monospace font, padding 2px 6px
- All code blocks and terminal commands:
  - Dark background #1e1e1e
  - Light gray text #d4d4d4
  - Rounded corners (8px)
  - A label bar at the top showing either "Terminal" or "Code" depending on context
  - A copy button that works
  - Line numbers for blocks longer than 5 lines
  - Subtle syntax coloring: strings in #ce9178 (orange), keywords in #569cd6 (blue),
    comments in #6a9955 (green), numbers in #b5cea8 (light green)

TABLES:
- All markdown tables converted to styled HTML tables
- Header row: dark navy background (#1a3a5c) with white text, bold
- Alternating row colors: white and #f5f7fa
- Hover highlight on rows: #e8f4fd
- Rounded corners on the overall table
- Responsive: horizontal scroll on mobile

FILE PATH DISPLAY:
- All file paths displayed in a distinctive style: monospace, dark background pill/badge
- Color: green text (#98c379) on dark background (#1e1e1e)

WORKFLOW DIAGRAM (Section 13):
Convert the three workflow text blocks (One-Time Setup, Development Cycle,
Maintenance Cycle) into visual flowcharts using styled HTML and CSS:
- Each step in a rounded rectangle box
- Arrows between steps using CSS borders or Unicode arrows
- Color each workflow differently:
  One-Time Setup: blue boxes (#1a3a5c)
  Development Cycle: teal boxes (#0d7377)
  Maintenance Cycle: green boxes (#2e7d32)
- The cycle arrow in Development Cycle should form a visual loop

GLOSSARY (Appendix B):
Convert the glossary table into a card grid layout:
- 2 columns on desktop, 1 column on mobile
- Each card: white background, subtle shadow, rounded corners
- Term in bold colored text (#1a3a5c) at the top
- Definition in regular body text below
- Subtle hover effect (slight shadow increase)

PROJECT FILE MAP (Appendix C):
Style the file tree as a proper styled tree component:
- Folder icons before directory names
- File icons before file names
- Indentation lines (vertical bars) to show hierarchy
- Color-code by file type: .ts files in blue, .js files in yellow, .md files in green,
  .json files in orange
- Annotations on the right side in muted gray text

FOOTER:
- Full-width footer with dark background (#1a3a5c)
- Text: "CMDB Health Doctor — ServiceNow SDK Documentation"
- Secondary text: "Built with Claude Code + ServiceNow SDK 4.4.1"
- Light text color

JAVASCRIPT FEATURES:
- Smooth scrolling for all anchor links
- Active section highlighting in the sidebar as user scrolls
- Copy to clipboard functionality on all code blocks
- A "Back to top" floating button that appears after scrolling down 300px
- Sidebar toggle for mobile (hamburger menu)
- Optional: a simple progress bar at the very top of the page showing reading progress

OUTPUT FORMAT:
Provide the complete document as a single self-contained HTML file.
All CSS must be inside a <style> tag in the <head>.
All JavaScript must be inside a <script> tag at the bottom of the <body>.
Do not use any external CSS frameworks like Bootstrap or Tailwind.
Do not link to any external resources except Google Fonts.
The file must render perfectly when opened directly in Chrome, Safari, or Firefox
with no server required.

CONTENT RULES:
- Keep every single word of the original content intact
- Do not shorten, summarize, reorder, or remove any section
- Do not add new content that is not in the original
- Preserve all prompts word-for-word exactly as written
- Preserve all code blocks exactly as written
- The document is for a layman audience — keep the friendly explanatory tone intact

[PASTE THE ENTIRE CONTENTS OF GUIDE.md HERE]

---

## WHAT YOU WILL GET BACK

Claude Chat will return a complete HTML file. To use it:

1. Copy the entire HTML response from Claude Chat
2. Open any plain text editor (TextEdit on Mac, Notepad on Windows)
3. Paste the HTML
4. Save the file as documentation.html
5. Double-click the file to open it in your browser
6. The documentation will render with full styling, sidebar, and copy buttons

## TIPS FOR BEST RESULTS

- Use Claude.ai (the web interface) not the API for this — it handles long outputs better
- If the response gets cut off, reply with: "Please continue from where you left off"
- If any section looks unstyled, reply with: "The [section name] section lost its styling,
  please regenerate just that section's HTML with the correct styles applied"
- Save the HTML file immediately after getting it — do not lose it
