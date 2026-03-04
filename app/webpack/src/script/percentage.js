export const TOTAL_OBSERVATIONS = 173234;
export const idToObservation = new Map();

export function initIdMap(data) {
    data.forEach(d => {
        idToObservation.set(d.id, d.observation);
    });
}

export function getSelectionPercentage(selectedIds) {
    if (!(selectedIds instanceof Set) || selectedIds.size === 0) {
        return { fraction: `0 / ${TOTAL_OBSERVATIONS}`, percentage: 0 };
    }

    let sum = 0;
    selectedIds.forEach(id => {
        sum += idToObservation.get(id) || 0;
    });

    const fraction = `${sum} / ${TOTAL_OBSERVATIONS}`;     // literal string
    const percentage = (sum / TOTAL_OBSERVATIONS) * 100;  // real number

    return { fraction, percentage };
}


export function updatePercentageUI(fraction, percentage) {
    const percentEl = document.getElementById("selected-percentage");
    const fractionEl = document.getElementById("selected-fraction");
    if (percentEl) {
        if (percentage != 0) {
            percentEl.textContent = `Selezionato: ${percentage.toFixed(0)}%`;
        } else {
            percentEl.textContent = "";
        }
        
    }
    if (fractionEl) {
        if (fraction != `0 / ${TOTAL_OBSERVATIONS}`) {
            fractionEl.textContent = `(${fraction})`;
        } else {
            fractionEl.textContent = "";
        }
        
    }
}

