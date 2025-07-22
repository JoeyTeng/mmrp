export const snakeCasedModules = [
  {
    id: 0,
    name: "blur",
    role: "process_node",
    parameters: [
      {
        name: "kernel_size",
        type: "int",
        description: null,
        default: 5,
        constraints: null,
        required: true,
      },
      {
        name: "method",
        type: "str",
        description: null,
        default: "gaussian",
        constraints: ["gaussian", "median", "bilateral"],
        required: true,
      },
    ],
    input_formats: [
      {
        pixel_format: "bgr24",
        color_space: "BT.709 Full",
        width: null,
        height: null,
        frame_rate: null,
      },
    ],
    output_formats: [
      {
        pixel_format: "bgr24",
        color_space: "BT.709 Full",
        width: null,
        height: null,
        frame_rate: null,
      },
    ],
  },
];
