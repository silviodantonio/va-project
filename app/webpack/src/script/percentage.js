const TOTAL_OBSERVATIONS = 173234;
const idToObservation = new Map();

export function initIdMap(data) {
    data.forEach(d => {
        idToObservation.set(d.id, d.observation);
    });
}

export function getSelectionPercentage(selectedIds) {
    if (!(selectedIds instanceof Set) || selectedIds.size === 0) return 0;

    let sum = 0;
    selectedIds.forEach(id => {
        sum += idToObservation.get(id) || 0;
    });

    return (sum / TOTAL_OBSERVATIONS) * 100;
}

export function updatePercentageUI(value) {
    const el = document.getElementById("selection-percentage");
    if (!el) return;

    el.textContent = `Selected: ${value.toFixed(2)}%`;
}

