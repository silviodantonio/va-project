import { resetAllSelections } from "./selectionStore.js";


export function initTopRevealButton(options = {}) {
    const {
        label = 'Reset',
        revealOffset = 40
    } = options;

    const container = document.createElement('div');
    container.id = 'top-reveal-container';

    const tab = document.createElement('div');
    tab.id = 'top-reveal-tab';

    const button = document.createElement('button');
    button.id = 'top-reveal-btn';
    button.textContent = label;


    button.addEventListener('click', () => {
        resetAllSelections();
        document.querySelector('#slider').value = 0;
    });

    container.appendChild(tab);
    container.appendChild(button);
    document.body.appendChild(container);

    document.addEventListener('mousemove', (e) => {
        const rect = container.getBoundingClientRect();

        const nearTop = e.clientY <= revealOffset;
        const nearHorizontally =
            e.clientX >= rect.left - 40 &&
            e.clientX <= rect.right + 40 &&
            e.clientY >= rect.top - 30 &&
            e.clientY <= rect.bottom + 30;

        if (nearTop && nearHorizontally) {
            container.classList.add('visible');
        } else {
            container.classList.remove('visible');
        }
    });
}
