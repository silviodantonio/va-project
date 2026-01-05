export const selectionStore = {
    pca: null,
    region: null,
    heatmap: null
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