const fs = require('fs');
const path = 'z:/Focusbook/FocusBookV8/src/renderer/app_old/style2.css';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix unicode corruption
content = content.replace(/Â·/g, '·');
content = content.replace(/â”€/g, '─');

// 2. Remove broken closing brace / dot leftover from previous mistake
content = content.replace(/}\s*color: var\(--ink-4\);\s*font-weight: 400;\s*}/, '}');

// 3. Strip all keyframes carried-glow entirely
content = content.replace(/@keyframes carried-glow\s*\{[\s\S]*?\n\}/g, '');

// 4. Ensure .badge dot separator is correct
content = content.replace(/\/\* Separator dot between badges \*\/\s*\.task-meta \.badge \+ \.badge::before \{\s*content: '·';\s*margin-right: 4px;\s*\}/, '');

const badgeDot = `/* Separator dot between badges */
.task-meta .badge + .badge::before {
    content: '·';
    margin-right: 4px;
    color: var(--ink-4);
    font-weight: 400;
}`;
content = content.replace(/\/\* ── SUB-ITEMS/, badgeDot + '\n\n/* ── SUB-ITEMS');

// 5. Inject exact new keyframes correctly below pointer-events: none;
const appendTarget = '    pointer-events: none;\r\n}';
const newKeyframes = `    pointer-events: none;\r\n}\r\n\r\n@keyframes carried-glow {\r\n    0%, 100% {\r\n        transform: scale(1);\r\n        opacity: 0.9;\r\n        box-shadow: 0 0 3px 1px rgba(232, 197, 71, 0.4);\r\n    }\r\n    50% {\r\n        transform: scale(1.4);\r\n        opacity: 0.5;\r\n        box-shadow: 0 0 5px 2px rgba(232, 197, 71, 0.25);\r\n    }\r\n}`;

content = content.replace(appendTarget, newKeyframes);
fs.writeFileSync(path, content, 'utf8');
console.log('Fixed CSS.');
