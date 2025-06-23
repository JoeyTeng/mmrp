/**
 * Validator file for module input/output formats for:
 * 1) Node to Node I/O Compatability
 * 2) Within Node I/O Format Compatability
 */
import {
  type FormatType,
  getPortsForNode,
} from "@/components/modules/modulesRegistry";
import { NodeData, NodeType } from "@/components/drag-and-drop/FlowNode";
import { type Node } from "@xyflow/react";

function isFormatsCompatible(
  sourceFormat: FormatType,
  targetFormat: FormatType,
): { isValid: boolean; reason?: string } {
  // Check resolution compatibility
  if (
    sourceFormat.resolution &&
    targetFormat.resolution &&
    (sourceFormat.resolution.width !== targetFormat.resolution.width ||
      sourceFormat.resolution.height !== targetFormat.resolution.height)
  ) {
    return {
      isValid: false,
      reason: `Resolution mismatch: Source Output (${sourceFormat.resolution.width}x${sourceFormat.resolution.height}) vs Target Expects (${targetFormat.resolution.width}x${targetFormat.resolution.height})`,
    };
  }

  // Check frame rate compatibility
  if (
    sourceFormat.frameRate &&
    targetFormat.frameRate &&
    sourceFormat.frameRate !== targetFormat.frameRate
  ) {
    return {
      isValid: false,
      reason: `Frame rate mismatch: Source Output (${sourceFormat.frameRate} fps) vs Target Expects (${targetFormat.frameRate} fps)`,
    };
  }

  // Check pixel format compatibility
  if (
    sourceFormat.pixelFormat &&
    targetFormat.pixelFormat &&
    sourceFormat.pixelFormat !== targetFormat.pixelFormat
  ) {
    return {
      isValid: false,
      reason: `Pixel format mismatch: Source Output (${sourceFormat.pixelFormat}) vs Target Expects (${targetFormat.pixelFormat})`,
    };
  }

  // Check color space compatibility
  if (
    sourceFormat.colorSpace &&
    targetFormat.colorSpace &&
    sourceFormat.colorSpace !== targetFormat.colorSpace
  ) {
    return {
      isValid: false,
      reason: `Color space mismatch: Source Output (${sourceFormat.colorSpace}) vs Target Expects (${targetFormat.colorSpace})`,
    };
  }

  // All checks passed
  return { isValid: true };
}
export default function isNodeConnectionValid(
  sourceNode: Node<NodeData, NodeType>, // Source node object
  sourcePortId: string, // ID of the source port
  targetNode: Node<NodeData, NodeType>, // Target node object
  targetPortId: string, // ID of the target port
): { isValid: boolean; reason?: string | undefined } {
  // Keep in mind multi port possibility
  const { outputPorts: outputPorts } = getPortsForNode(
    sourceNode.data.label,
    sourceNode.data.params,
  );
  const { inputPorts: inputPorts } = getPortsForNode(
    targetNode.data.label,
    targetNode.data.params,
  );

  const sourcePort = outputPorts.find((port) => port.id === sourcePortId);
  if (!sourcePort) {
    return { isValid: false };
  }

  // Find the target port using its ID
  const targetPort = inputPorts.find((port) => port.id === targetPortId);
  if (!targetPort) {
    return { isValid: false }; // Invalid if the target port doesn't exist
  }

  // Validate the formats of the source port and target port
  const { isValid, reason } = isFormatsCompatible(
    sourcePort.formats,
    targetPort.formats,
  );

  if (!isValid) {
    return { isValid, reason };
  }

  // If all checks pass
  return { isValid: true };
}
