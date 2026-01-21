import { diffLines, diffChars } from 'diff';

const inputLeft = document.getElementById('inputLeft');
const inputRight = document.getElementById('inputRight');
const compareBtn = document.getElementById('compareBtn');
const backBtn = document.getElementById('backBtn');
const clearBtn = document.getElementById('clearBtn');
const diffOutput = document.getElementById('diffOutput');
const dropZoneLeft = document.getElementById('dropZoneLeft');
const dropZoneRight = document.getElementById('dropZoneRight');

// --- Event Listeners ---

compareBtn.addEventListener('click', () => {
    performDiff();
    // Toggle buttons and view
    compareBtn.classList.add('hidden');
    backBtn.classList.remove('hidden');
    document.querySelector('.split-view').classList.add('hidden');
    diffOutput.classList.remove('hidden');
});

backBtn.addEventListener('click', () => {
    compareBtn.classList.remove('hidden');
    backBtn.classList.add('hidden');
    document.querySelector('.split-view').classList.remove('hidden');
    diffOutput.classList.add('hidden');
});

clearBtn.addEventListener('click', () => {
    inputLeft.value = '';
    inputRight.value = '';
    diffOutput.innerHTML = '';

    // Reset view state
    diffOutput.classList.add('hidden');
    document.querySelector('.split-view').classList.remove('hidden');
    compareBtn.classList.remove('hidden');
    backBtn.classList.add('hidden');
});

// --- Drag and Drop Logic ---

function setupDragDrop(dropZone, inputElement) {
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            readTextFile(files[0], inputElement);
        }
    });
}

setupDragDrop(dropZoneLeft, inputLeft);
setupDragDrop(dropZoneRight, inputRight);

function readTextFile(file, inputElement) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const buffer = e.target.result;
        let text = '';

        // Try UTF-8 first
        try {
            const utf8Decoder = new TextDecoder('utf-8', { fatal: true });
            text = utf8Decoder.decode(buffer);
        } catch (e) {
            // If UTF-8 fails, try BIG5
            try {
                const big5Decoder = new TextDecoder('big5');
                text = big5Decoder.decode(buffer);
                console.log('Decoded as BIG5');
            } catch (e2) {
                console.error('Decoding failed', e2);
                text = 'Error: Could not decode file. Supported encodings: UTF-8, BIG5.';
            }
        }

        inputElement.value = text;
        // Trigger input event to ensure any listeners update
        inputElement.dispatchEvent(new Event('input', { bubbles: true }));
    };
    // Read as ArrayBuffer allows us to handle raw bytes for decoding
    reader.readAsArrayBuffer(file);
}

// --- Diff Logic ---

function performDiff() {
    const text1 = inputLeft.value;
    const text2 = inputRight.value;

    // Use diffLines for line-by-line comparison
    // Note: newlineIsToken: true can help with finer granularity but simple diffLines is usually okay.
    const diff = diffLines(text1, text2);

    diffOutput.innerHTML = '';

    // Create Layout
    const header = document.createElement('div');
    header.className = 'diff-header';
    header.innerHTML = `
        <div class="diff-header-col">Original (${text1.length} chars)</div>
        <div class="diff-header-col">Modified (${text2.length} chars)</div>
    `;
    diffOutput.appendChild(header);

    const container = document.createElement('div');
    container.className = 'diff-container';

    const leftCol = document.createElement('div');
    leftCol.className = 'diff-col';

    const rightCol = document.createElement('div');
    rightCol.className = 'diff-col';

    container.appendChild(leftCol);
    container.appendChild(rightCol);
    diffOutput.appendChild(container);

    let parts = [];

    for (let i = 0; i < diff.length; i++) {
        const part = diff[i];
        let lines = part.value.split('\n');
        if (lines.length > 1 && lines[lines.length - 1] === '') {
            lines.pop();
        }

        if (part.added) {
            lines.forEach(line => {
                parts.push({ left: null, right: line, type: 'added' });
            });
        } else if (part.removed) {
            if (i + 1 < diff.length && diff[i + 1].added) {
                const nextPart = diff[i + 1];
                const nextLines = nextPart.value.split('\n');
                if (nextLines.length > 1 && nextLines[nextLines.length - 1] === '') {
                    nextLines.pop();
                }

                const count = Math.max(lines.length, nextLines.length);
                for (let j = 0; j < count; j++) {
                    const l = lines[j] !== undefined ? lines[j] : null;
                    const r = nextLines[j] !== undefined ? nextLines[j] : null;
                    parts.push({ left: l, right: r, type: 'mod' });
                }
                i++;
            } else {
                lines.forEach(line => {
                    parts.push({ left: line, right: null, type: 'removed' });
                });
            }
        } else {
            lines.forEach(line => {
                parts.push({ left: line, right: line, type: 'common' });
            });
        }
    }

    parts.forEach(p => {
        const lDiv = document.createElement('div');
        lDiv.className = 'diff-line' + (p.type === 'removed' ? ' diff-removed' : p.type === 'mod' ? ' diff-mod-left' : '');

        const rDiv = document.createElement('div');
        rDiv.className = 'diff-line' + (p.type === 'added' ? ' diff-added' : p.type === 'mod' ? ' diff-mod-right' : '');

        if (p.type === 'mod' && p.left !== null && p.right !== null) {
            const charDiff = (typeof Diff !== 'undefined' && Diff.diffChars) ? Diff.diffChars(p.left, p.right) : diffChars(p.left, p.right);

            lDiv.innerHTML = '';
            rDiv.innerHTML = '';

            charDiff.forEach(part => {
                if (part.removed) {
                    const span = document.createElement('span');
                    span.className = 'diff-char-removed';
                    span.textContent = part.value;
                    lDiv.appendChild(span);
                } else if (part.added) {
                    const span = document.createElement('span');
                    span.className = 'diff-char-added';
                    span.textContent = part.value;
                    rDiv.appendChild(span);
                } else {
                    lDiv.appendChild(document.createTextNode(part.value));
                    rDiv.appendChild(document.createTextNode(part.value));
                }
            });

        } else {
            if (p.left === null) {
                lDiv.classList.add('diff-empty');
                lDiv.innerHTML = '&nbsp;';
            } else {
                lDiv.textContent = p.left || ' ';
                if (p.left === '') lDiv.innerHTML = '&nbsp;';
            }

            if (p.right === null) {
                rDiv.classList.add('diff-empty');
                rDiv.innerHTML = '&nbsp;';
            } else {
                rDiv.textContent = p.right || ' ';
                if (p.right === '') rDiv.innerHTML = '&nbsp;';
            }
        }

        leftCol.appendChild(lDiv);
        rightCol.appendChild(rDiv);
    });
}
