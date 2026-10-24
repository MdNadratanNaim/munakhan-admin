import { Icon } from "@/components/ui/Icon";

/** The little pencil that appears on hover over anything you can click to change. */
export function EditBadge() {
  return (
    <span className="edit-badge" aria-hidden="true">
      <Icon name="pencil" size={12} />
    </span>
  );
}
