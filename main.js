import { diffLines } from 'diff';

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
        inputElement.value = e.target.result;
    };
    reader.readAsText(file);
}

// --- Diff Logic ---

function performDiff() {
    const text1 = inputLeft.value;
    const text2 = inputRight.value;

    // Use specific diff library function (lines, words, chars)
    // Ideally lines is good for code/logs.
    const diff = diffLines(text1, text2);

    // We can render this in a new overlay or replace the textareas.
    // For a nice UI, let's create a "Result View" that overlays the editors.
    // Or we can just print it to the bottom.

    // Let's try to display it in the diffOutput div for now.
    // Clear previous output
    diffOutput.innerHTML = '';

    // Note: View toggling is handled in the event listener now

    const fragment = document.createDocumentFragment();

    diff.forEach((part) => {
        // green for additions, red for deletions
        // grey for common parts
        const color = part.added ? 'diff-added' :
            part.removed ? 'diff-removed' : 'diff-common';

        const span = document.createElement('span');
        span.className = color;
        span.appendChild(document.createTextNode(part.value));
        fragment.appendChild(span);
    });

    diffOutput.appendChild(fragment);

    // diffOutput.appendChild(fragment); // Removed duplicate
}
