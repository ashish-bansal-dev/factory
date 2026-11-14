import { defineCustomFieldsConfig } from "@mercurjs/dashboard-sdk";
import { Badge, Text } from "@medusajs/ui";

type VariantRow = { sku?: string | null; updated_at?: string | Date | null };

export default defineCustomFieldsConfig({
  model: "product",
  link: "brand",
  displays: [
    {
      zone: "general",
      fields: [
        // REMOVE — built-in id + null hides the field
        { id: "subtitle", component: null },
        // REPLACE — built-in id + component overrides its render
        {
          id: "handle",
          component: ({ data }) => (
            <Text size="small" className="text-ui-fg-subtle px-6 py-4">
              /{(data as { handle?: string })?.handle}
            </Text>
          ),
        },
      ],
    },
  ],
  list: [
    {
      viewDefaults: {
        columnVisibility: { collection: false }, // HIDE the built-in collection column
        columnOrder: ["product", "status"], // reorder
      },
    },
    // Product detail → variants table
    {
      zone: "variants",
      columns: [
        {
          id: "sku",
          header: "SKU (custom)",
          component: ({ row }) => (
            <Badge size="2xsmall" color="purple">
              {(row as VariantRow).sku ?? "-"}
            </Badge>
          ),
        },
        {
          id: "updated",
          header: "Updated",
          component: ({ row }) => {
            const updatedAt = (row as VariantRow).updated_at;
            return (
              <Text size="small" className="text-ui-fg-subtle">
                {updatedAt ? new Date(updatedAt).toLocaleDateString() : "-"}
              </Text>
            );
          },
        },
      ],
    },
  ],
});

