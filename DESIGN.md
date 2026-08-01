# Design System

This file describes the UI that is currently shipped. Update it before introducing a new visual rule.

## Product principle

The interface exists to make workout planning and logging fast. Use spatial grouping, ordering, and interaction before adding explanatory text. Decorative styling must not compete with movement names, targets, set progress, or calendar state.

## Visual language

- White page and panel surfaces with black text.
- Square corners and thin borders; no decorative shadows.
- One primary volt-green accent for current, selected, completed, and composite states.
- Blue identifies additive actions and training scores.
- Purple identifies setup metadata.
- Red is reserved for destructive actions and errors.
- User-selected workout colors identify templates and calendar entries. They are identity markers, not general UI accents.

All reusable colors live in `:root` in `styles.css`. Components use those variables instead of adding one-off values.

### Core tokens

| Token | Purpose |
| --- | --- |
| `--bg`, `--panel` | Page and primary surfaces |
| `--panel-2` | Quiet secondary surface |
| `--ink`, `--muted` | Primary and secondary text |
| `--line`, `--soft-line` | Strong and quiet boundaries |
| `--accent` | Selection, today, completion, composite score |
| `--add` | Additive actions and training score |
| `--score-metadata` | Setup metadata score |
| `--danger` | Destructive actions and errors only |

The 3D movement viewer is grayscale by default. Selecting a muscle uses `--accent`. Workout heatmaps use the workout's chosen color, with intensity encoding the accumulated primary/secondary/support score.

## Shape and controls

- Corners remain square.
- Boundaries are one pixel; spacing and borders create hierarchy.
- Buttons share the page surface unless color communicates a state or action.
- Use icons for compact, familiar actions such as add, remove, drag, and settings.
- Keep destructive controls visually separate from ordinary navigation.
- Native browser confirmation dialogs are not used; confirmations use the app modal.

## Typography

- Use the system sans-serif stack already defined by `--font-body`.
- Movement and workout names carry hierarchy through size and weight.
- Labels are short and secondary; do not add headings that merely repeat layout structure.
- Do not shrink essential mobile text to fit. Wrap names and preserve readable line height.

## Layout and information flow

- Mobile is the primary viewport; verify at 390px before desktop.
- The app is a centered single-column shell with additional columns only where comparison benefits from them.
- Repeated movement cards use stable grids so scores and controls do not shift between entries.
- Expanded views add detail without repeating the compressed card's title, tags, description, or summary scores.
- Workout blocks are defined by their containers and order, not extra labels.
- Live workouts show one block at a time on mobile and expose progress continuously.

## Color semantics

Color must answer one of these questions:

- What is selected or current?
- Is this action additive or destructive?
- Is this score training, setup, or composite?
- Which workout does this calendar item represent?
- How strongly is this muscle represented in the workout?

If color answers none of them, use a neutral surface.

## Interaction rules

- Preserve user context when closing a detail, compare, editor, or modal view.
- Filters retain selection across category branches.
- Changes made during a live workout persist immediately to local storage.
- Drag and swipe interactions need visible handles or affordances and a non-gesture fallback when the action is essential.
- Avoid extra confirmation steps for reversible actions. Confirm destructive template or workout deletion.

## Shipping checklist

1. The main calendar, movement search/filter, template builder, and live logging flows work at 390px.
2. Text and controls do not overflow their containers.
3. Interactive state is visible without relying on hover.
4. New colors use existing semantic tokens.
5. Hidden or replaced 3D viewers stop rendering and release their WebGL resources.
6. Movement changes pass validation and `data/movements.json` is current.
7. The service-worker cache version is bumped when deployed app files change.
