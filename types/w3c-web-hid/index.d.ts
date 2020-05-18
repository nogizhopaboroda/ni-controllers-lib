declare class HID {
  requestDevice(options?: {
    filters: Array<{
      vendorId: number;
      productId: number;
    }>;
  }): Promise<Array<HIDDevice>>;
}

declare class HIDInputReportEvent extends Event {
  readonly device: HIDDevice;
  readonly reportId: number;
  readonly data: DataView;
}

declare class HIDDevice extends EventTarget {
  open(): Promise<void>;
  sendReport(reportId: number, data: BufferSource): Promise<void>;
  addEventListener(
    type: "inputreport",
    listener: (this: this, ev: HIDInputReportEvent) => any,
    useCapture?: boolean
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject | null,
    options?: boolean | AddEventListenerOptions
  ): void;
}

interface Navigator {
  readonly hid: HID;
}
