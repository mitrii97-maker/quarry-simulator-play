// Stage-one switch. Turning this off restores the retained quarry start without
// deleting any model, route, save data or gameplay module.
export const ENABLE_GREENFIELD_STAGE1 = true;
export const STARTER_MACHINE_ID = 'ew160';
export const LEGACY_MACHINE_ID = 'volvo';
export const STARTER_TRUCK_CAPACITY = 20;

export function greenfieldSelected(storage = globalThis.localStorage) {
  if (!ENABLE_GREENFIELD_STAGE1 || !storage) return false;
  try {
    const selected = storage.getItem('quarry-machine-v1');
    return selected === null || selected === STARTER_MACHINE_ID;
  } catch {
    return false;
  }
}

// Node acceptance checks have no browser storage and therefore continue to
// exercise the retained production quarry. A browser new game selects EW160.
export const GREENFIELD_ACTIVE = greenfieldSelected();

export const GREENFIELD_LAYOUT = Object.freeze({
  fieldRadius: 150,
  treeInnerRadius: 92,
  treeOuterRadius: 142,
  roadWidth: 6.2,
  startLabel: 'РАЗВЕДОЧНЫЙ УЧАСТОК № 1'
});
