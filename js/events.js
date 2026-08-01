const ACTION_ATTRIBUTE_BY_EVENT = {
  click: "data-action",
  input: "data-input-action",
  submit: "data-submit-action",
  keydown: "data-keydown-action",
  touchstart: "data-touchstart-action",
  touchend: "data-touchend-action",
  pointerdown: "data-pointerdown-action",
  pointermove: "data-pointermove-action",
  pointerup: "data-pointerup-action",
  pointercancel: "data-pointercancel-action",
  dragstart: "data-dragstart-action",
  dragover: "data-dragover-action",
  dragleave: "data-dragleave-action",
  drop: "data-drop-action",
  dragend: "data-dragend-action"
};

export function installEventDelegation(root, handlers) {
  Object.entries(ACTION_ATTRIBUTE_BY_EVENT).forEach(([eventType, attribute]) => {
    root.addEventListener(eventType, event => {
      const control = event.target.closest?.(`[${attribute}]`);
      if (!control || !root.contains(control)) return;

      const action = control.getAttribute(attribute);
      const handler = handlers[eventType]?.[action];
      if (!handler) {
        console.warn(`No delegated ${eventType} handler registered for "${action}"`);
        return;
      }

      handler(event, control);
    });
  });
}
