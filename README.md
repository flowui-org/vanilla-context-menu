# @flowui/vanilla-context-menu

`@flowui/vanilla-context-menu` is a part of the `@flowui/vanilla` echo system.

This package offers an API that enables the addition of Custom Context Menus in a browser.

## Example Usage

### ESM

```js
import { ContextMenu, ContextMenuItemOrItemsGroup } from "@flowui/vanilla-context-menu";

createContextMenu({
  target: ".selector",
  menuItems: [
    { label: "Cut" },
    { label: "Copy" },
    { label: "Paste" },
    { label: "Download" },
    { label: "Delete" },
  ],
});
```

### UMD

```html
<script src="https://cdn.jsdelivr.net/npm/@flowui/vanilla-context-menu/umd/vanilla-context-menu.min.js"></script>
<script>
  FlowUI.createContextMenu({
    target: ".selector",
    menuItems: [
      { label: "Cut" },
      { label: "Copy" },
      { label: "Paste" },
      { label: "Download" },
      { label: "Delete" },
    ],
  });
</script>
```
