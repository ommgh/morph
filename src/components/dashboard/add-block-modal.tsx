"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTamboThread, useTamboThreadInput } from "@tambo-ai/react";
import { Loader2 } from "lucide-react";
import { useCanvasStore, generateId } from "@/lib/canvas-storage";
import { components } from "@/lib/tambo";

interface AddBlockModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

/**
 * Helper function to extract component type and props from rendered component
 * Similar to the one in message.tsx but with better fallback handling
 */
function extractComponentInfo(renderedComponent: React.ReactNode): {
  componentType: string | null;
  componentProps: Record<string, unknown>;
} {
  let componentType: string | null = null;
  let componentProps: Record<string, unknown> = {};

  if (!React.isValidElement(renderedComponent)) {
    return { componentType, componentProps };
  }

  const wrapperElement = renderedComponent as React.ReactElement;

  // Try to find the actual component - it might be wrapped in a provider or container
  let targetElement: React.ReactElement | null = null;

  // Case 1: Direct component (no wrapper)
  if (typeof wrapperElement.type === "function") {
    const matchedDirect = components.find(
      (comp) => comp.component === wrapperElement.type,
    );
    if (matchedDirect) {
      targetElement = wrapperElement;
    }
  }

  // Case 2: Component wrapped in a container (has children)
  const wrapperProps = wrapperElement.props as { children?: React.ReactNode };
  if (!targetElement && wrapperProps?.children) {
    const children = wrapperProps.children;

    // Handle single child
    if (React.isValidElement(children)) {
      targetElement = children as React.ReactElement;
    }
    // Handle array of children - find the first valid component
    else if (Array.isArray(children)) {
      for (const child of children) {
        if (React.isValidElement(child)) {
          const matched = components.find(
            (comp) => comp.component === (child as React.ReactElement).type,
          );
          if (matched) {
            targetElement = child as React.ReactElement;
            break;
          }
        }
      }
    }
  }

  // Extract info from target element
  if (targetElement && React.isValidElement(targetElement)) {
    // Try to match with registered components
    const matchedComponent = components.find(
      (comp) => comp.component === targetElement!.type,
    );

    if (matchedComponent) {
      componentType = matchedComponent.name;
    } else if (typeof targetElement.type === "function") {
      const typeFunc = targetElement.type as React.ComponentType<unknown> & {
        displayName?: string;
        name?: string;
      };
      componentType = typeFunc.displayName || typeFunc.name || null;
    } else if (typeof targetElement.type === "string") {
      // It's a DOM element, not a component
      componentType = null;
    }

    if (targetElement.props) {
      componentProps = { ...targetElement.props };
      // Remove internal React props
      delete componentProps.children;
    }
  }

  return { componentType, componentProps };
}

export function AddBlockModal({ open, onOpenChange }: AddBlockModalProps) {
  const [url, setUrl] = React.useState("");
  const [method, setMethod] = React.useState<HttpMethod>("GET");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const { submit, setValue } = useTamboThreadInput();
  const { thread, isIdle } = useTamboThread();
  const { addComponent, activeCanvasId } = useCanvasStore();

  // Track when we're waiting for component generation
  const pendingGenerationRef = React.useRef(false);
  const processedMessageIdsRef = React.useRef(new Set<string>());

  // Watch for new components in thread messages
  React.useEffect(() => {
    if (!pendingGenerationRef.current || !thread?.messages) return;
    if (!isIdle) return; // Wait until generation is complete

    const messages = thread.messages;
    if (messages.length === 0) return;

    // First, try to find a message with component metadata (componentName and props)
    // This is the most reliable way as it comes directly from Tambo
    const messageWithComponentMeta = [...messages]
      .reverse()
      .find(
        (m) =>
          m.role === "assistant" &&
          (m as { component?: { componentName?: string } }).component
            ?.componentName &&
          !processedMessageIdsRef.current.has(m.id),
      );

    if (messageWithComponentMeta && activeCanvasId) {
      const componentMeta = (
        messageWithComponentMeta as {
          component: { componentName: string; props: Record<string, unknown> };
        }
      ).component;
      const { componentName, props: componentProps } = componentMeta;

      // Mark this message as processed
      processedMessageIdsRef.current.add(messageWithComponentMeta.id);

      // Add component to canvas
      const componentId = generateId();
      addComponent(activeCanvasId, {
        componentId,
        _componentType: componentName,
        _inCanvas: true,
        canvasId: activeCanvasId,
        ...componentProps,
      });

      // Reset state and close modal
      pendingGenerationRef.current = false;
      setIsGenerating(false);
      setUrl("");
      setError(null);
      onOpenChange(false);
      return;
    }

    // Fallback: try to find a message with renderedComponent
    const messageWithComponent = [...messages]
      .reverse()
      .find(
        (m) =>
          m.role === "assistant" &&
          m.renderedComponent &&
          !processedMessageIdsRef.current.has(m.id),
      );

    if (!messageWithComponent) {
      console.log("[AddBlockModal] No message with component found");
      return;
    }

    const renderedComponent = messageWithComponent.renderedComponent;
    if (renderedComponent && activeCanvasId) {
      // Extract component type and props using the helper
      const { componentType, componentProps } =
        extractComponentInfo(renderedComponent);

      if (componentType) {
        // Mark this message as processed
        processedMessageIdsRef.current.add(messageWithComponent.id);

        // Add component to canvas
        const componentId = generateId();
        addComponent(activeCanvasId, {
          componentId,
          _componentType: componentType,
          _inCanvas: true,
          canvasId: activeCanvasId,
          ...componentProps,
        });

        // Reset state and close modal
        pendingGenerationRef.current = false;
        setIsGenerating(false);
        setUrl("");
        setError(null);
        onOpenChange(false);
      }
    }
  }, [thread?.messages, isIdle, activeCanvasId, addComponent, onOpenChange]);

  const handleGenerate = React.useCallback(async () => {
    if (!url.trim()) {
      setError("Please enter a URL");
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      setError("Please enter a valid URL");
      return;
    }

    if (!activeCanvasId) {
      setError("No active canvas. Please create a canvas first.");
      return;
    }

    setError(null);
    setIsGenerating(true);
    pendingGenerationRef.current = true;

    try {
      // Create a prompt for Tambo to fetch and display the data
      const prompt = `Fetch data from ${url} using ${method} method and display it using the most appropriate component. Analyze the response structure and choose the best visualization.`;

      setValue(prompt);

      // Small delay to ensure value is set
      await new Promise((resolve) => setTimeout(resolve, 50));

      await submit({
        streamResponse: true, // Use streaming mode (non-streaming is deprecated)
      });
    } catch (err) {
      console.error("Failed to generate component:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate component",
      );
      setIsGenerating(false);
      pendingGenerationRef.current = false;
    }
  }, [url, method, activeCanvasId, setValue, submit]);

  const handleClose = React.useCallback(() => {
    if (!isGenerating) {
      setUrl("");
      setError(null);
      onOpenChange(false);
    }
  }, [isGenerating, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Block from API</DialogTitle>
          <DialogDescription>
            Enter an API URL to fetch data and automatically generate a
            component to display it.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="url">API URL</Label>
            <Input
              id="url"
              placeholder="https://api.example.com/data"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="method">HTTP Method</Label>
            <Select
              value={method}
              onValueChange={(v) => setMethod(v as HttpMethod)}
              disabled={isGenerating}
            >
              <SelectTrigger id="method">
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !url.trim()}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Block"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
