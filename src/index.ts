export type ContextMenuTarget = string | HTMLElement | null;

export type ContextMenuItem = {
  label: string;
  events?: Record<string, (event: Event) => void>;
};

export type ContextMenuItemsGroup = ContextMenuItem[];

export type ContextMenuItemOrItemsGroup =
  | ContextMenuItem
  | ContextMenuItemsGroup;

export type ContextMenuAppearance = "light" | "dark";

export type ContextMenuOptions = {
  target: ContextMenuTarget;
  menuItems: ContextMenuItemOrItemsGroup[];
  appearance?: ContextMenuAppearance;
};

const styles = `
.contextMenu {
  --menu-border: rgba(255, 255, 255, 0.08);
  --menu-bg: rgba(10, 20, 28, 0.7);
  --item-border: rgba(255, 255, 255, 0.1);
  --item-color: #fff;
  --item-bg-hover: rgba(255, 255, 255, 0.1);
  height: 0;
  min-width: 8rem;
  overflow: hidden;
  background: var(--menu-bg);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  position: fixed;
  top: var(--top);
  left: var(--left);
  animation: menuAnimation 0.4s 0s both;
  -webkit-animation: menuAnimation 0.4s 0s both;
  transform-origin: left;
  margin: 4px;
  padding: 0;
  display: flex;
  flex-direction: column;
  z-index: 99;
  box-shadow: 0 0 0 1px var(--menu-border), 0 2px 2px rgba(0, 0, 0, 0.03), 0 4px 4px rgba(0, 0, 0, 0.04), 0 10px 8px rgba(0, 0, 0, 0.05), 0 15px 15px rgba(0, 0, 0, 0.06), 0 30px 30px rgba(0, 0, 0, 0.07), 0 70px 65px rgba(0, 0, 0, 0.09);
}

.contextMenu-item {
  padding: 4px;
}

.contextMenu-item[data-divider]:not(:last-child) {
  border-bottom: 1px solid var(--item-border);
}

.contextMenu-button {
  color: var(--item-color);
  background: 0;
  border: 0;
  white-space: nowrap;
  width: 100%;
  border-radius: 4px;
  padding: 6px 24px 6px 7px;
  text-align: left;
  display: flex;
  align-items: center;
  font-size: 14px;
  width: 100%;

  -webkit-animation: menuItemAnimation 0.2s 0s both;
  animation: menuItemAnimation 0.2s 0s both;

  cursor: pointer;
}

.contextMenu-button:hover {
  background-color: var(--item-bg-hover);
}

.contextMenu[data-appearance=light] {
  --menu-bg: rgba(255, 255, 255, 0.85);
  --menu-border: rgba(0, 0, 0, 0.08);
  --item-border: rgba(30, 30, 30, 0.1);
  --item-color: rgb(10, 20, 28);
  --item-bg-hover: rgba(10, 20, 28, 0.09);
}

@-webkit-keyframes menuAnimation {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    height: var(--height);
    opacity: 1;
    border-radius: 8px;
    transform: scale(1);
  }
}

@keyframes menuAnimation {
  0% {
    opacity: 0;
    transform: scale(0.5);
  }
  100% {
    height: var(--height);
    opacity: 1;
    border-radius: 8px;
    transform: scale(1);
  }
}

@-webkit-keyframes menuItemAnimation {
  0% {
    opacity: 0;
    transform: translateX(-10px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes menuItemAnimation {
  0% {
    opacity: 0;
    transform: translateX(-10px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
`;

const CONTEXT_MENU_STYLE_ELEMENT_ID = "@flowui/vanilla-context-menu";

export class ContextMenu {
  private readonly target: ContextMenuTarget;
  private readonly menuItems: ContextMenuItemOrItemsGroup[];
  private readonly appearance: ContextMenuAppearance;
  private readonly targetNodes: HTMLElement[];
  private menuNode: HTMLElement | null;
  private menuItemsNode: HTMLElement[];
  private isOpened: boolean;

  public constructor({ target, menuItems, appearance }: ContextMenuOptions) {
    this.target = target;
    this.menuItems = menuItems;
    this.appearance = appearance ?? "light";
    this.targetNodes = this.getTargetNodes();
    this.menuItemsNode = this.createMenuItemNodes();
    this.isOpened = false;
    this.menuNode = null;
    this.closeMenu = this.closeMenu.bind(this);
  }

  private appendStyles() {
    const existingStyle = document.getElementById(
      CONTEXT_MENU_STYLE_ELEMENT_ID,
    );
    if (!existingStyle) {
      const style = document.createElement("style");
      style.textContent = styles;
      document.head.appendChild(style);
    }
  }

  private getTargetNodes(): HTMLElement[] {
    if (!this.target) {
      console.error(`ContextMenu:: invalid target "${this.target}"`);
      return [];
    }
    if (this.target instanceof HTMLElement) {
      return [this.target];
    }
    const nodes = document.querySelectorAll<HTMLElement>(this.target);
    if (nodes.length > 0) {
      return [...nodes];
    } else {
      console.error(`ContextMenu:: "${this.target}" target not found`);
      return [];
    }
  }

  private createMenuItemNodes(): HTMLElement[] {
    const nodes: HTMLElement[] = [];

    if (!this.menuItems) {
      console.error("ContextMenu:: menu is empty");
      return [];
    }

    for (let idx = 0; idx < this.menuItems.length; ++idx) {
      const itemOrGroup = this.menuItems[idx];
      if (Array.isArray(itemOrGroup)) {
        for (let idx2 = 0; idx2 < itemOrGroup.length; ++idx2) {
          const node = this.createMenuItemNode(itemOrGroup[idx2], idx);
          if (idx2 === itemOrGroup.length - 1) {
            node.setAttribute("data-divider", "");
          }
          nodes.push(node);
        }
      } else {
        nodes.push(this.createMenuItemNode(itemOrGroup, idx));
      }
    }

    return nodes;
  }

  private createMenuItemNode(
    item: ContextMenuItem,
    index: number,
  ): HTMLElement {
    const li = document.createElement("div");
    li.classList.add("contextMenu-item");

    const button = document.createElement("button");
    button.setAttribute("style", `animation-delay: ${index * 0.08}s`);
    button.innerHTML = item.label;
    button.classList.add("contextMenu-button");
    li.appendChild(button);

    const events = item.events ?? {};
    for (const event in events) {
      button.addEventListener(event, events[event]);
    }

    return li;
  }

  private renderMenu() {
    const menuContainer = document.createElement("div");
    menuContainer.classList.add("contextMenu");
    menuContainer.setAttribute("data-appearance", this.appearance);
    this.menuItemsNode.forEach((item) => menuContainer.appendChild(item));
    return menuContainer;
  }

  private closeMenu() {
    if (this.isOpened) {
      this.isOpened = false;
      this.menuNode?.remove();
      this.menuNode = null;
    }
  }

  public init() {
    document.addEventListener("click", this.closeMenu);
    window.addEventListener("blur", this.closeMenu);

    this.targetNodes.forEach((target) => {
      target.addEventListener("contextmenu", (e) => {
        e.preventDefault();

        this.closeMenu();

        this.isOpened = true;
        this.menuNode = this.renderMenu();

        const { clientX, clientY } = e;
        document.body.appendChild(this.menuNode);

        const positionY =
          clientY + this.menuNode.scrollHeight >= window.innerHeight
            ? window.innerHeight - this.menuNode.scrollHeight - 20
            : clientY;

        const positionX =
          clientX + this.menuNode.scrollWidth >= window.innerWidth
            ? window.innerWidth - this.menuNode.scrollWidth - 20
            : clientX;

        this.menuNode.setAttribute(
          "style",
          `--width: ${this.menuNode.scrollWidth}px;
          --height: ${this.menuNode.scrollHeight}px;
          --top: ${positionY}px;
          --left: ${positionX}px;`,
        );
      });
    });
    this.appendStyles();
  }
}

export function createContextMenu({
  target,
  menuItems,
  appearance,
}: ContextMenuOptions) {
  new ContextMenu({
    target,
    menuItems,
    appearance,
  }).init();
}
