export const selectionStore = {
    pca: null,
    region: null,
    heatmap_week_hours: null,
    heatmap_month_weeks: null,
    bar_accident_type:null,
    intersection:null
};

export function updateSelection(source, data) {
    selectionStore[source] = data;

    document.dispatchEvent(new CustomEvent("selection-changed", {
        detail: {
            source,
            store: selectionStore
        }
    }));
}

export function computeActiveSelection(store) {
    const sets = Object.values(store).filter(
        s => s && s.size > 0
    );

    if (sets.length === 0) return null;

    // INTERSECTION of all active selections
    return new Set(
        [...sets[0]].filter(id =>
            sets.every(s => s.has(id))
        )
    );
}