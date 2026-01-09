import { resetAllSelections } from "./selectionStore.js";


export function initTopRevealButton(options = {}) {
    const {
        label = 'Selection Reset',
        revealOffset = 15
    } = options;

    const container = document.createElement('div');
    container.id = 'top-reveal-container';

    const tab = document.createElement('div');
    tab.id = 'top-reveal-tab';

    const button = document.createElement('button');
    button.id = 'top-reveal-btn';
    button.textContent = label;


    button.addEventListener('click', resetAllSelections);

    container.appendChild(tab);
    container.appendChild(button);
    document.body.appendChild(container);

    document.addEventListener('mousemove', (e) => {
        if (e.clientY <= revealOffset) {
            container.classList.add('visible');
        } else {
            container.classList.remove('visible');
        }
    });
}
