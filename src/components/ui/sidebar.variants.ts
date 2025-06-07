import { cva } from "class-variance-authority";

export const sidebarItems = cva(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
    {
        variants: {
            isActive: {
                true: "bg-muted text-primary",
            },
        },
    }
); 