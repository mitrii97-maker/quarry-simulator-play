// Stage-one switch. Turning this off restores the retained quarry start without
// deleting any model, route, save data or gameplay module.
export const ENABLE_GREENFIELD_STAGE1 = true;
export const STARTER_MACHINE_ID = 'ew160';
export const LEGACY_MACHINE_ID = 'volvo';
export const STARTER_TRUCK_CAPACITY = 20;

export function greenfieldSelected() {
  // This build is published as a separate game under /greenfield/. It shares
  // the GitHub Pages origin with the retained quarry, so browser storage may
  // still contain that game's selected machine. The feature switch, not an
  // unrelated old selection, is the single source of truth for this build.
  return ENABLE_GREENFIELD_STAGE1;
}

export const GREENFIELD_ACTIVE = greenfieldSelected();

export const GREENFIELD_LAYOUT = Object.freeze({
  fieldRadius: 150,
  treeInnerRadius: 92,
  treeOuterRadius: 142,
  roadWidth: 6.2,
  startLabel: 'РАЗВЕДОЧНЫЙ УЧАСТОК № 1'
});
