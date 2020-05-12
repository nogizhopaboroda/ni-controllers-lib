import * as NodeHid from "node-hid";
import * as NodeUsb from "usb";

export interface UsbAdapter {
  open(): Promise<unknown>;

  claimInterface(interfaceId: number): Promise<unknown>;

  transferOut(endpointId: number, data: Uint8Array): Promise<unknown>;
}

export interface HidAdapter {
  open(): Promise<unknown>;

  write(data: Array<number>): Promise<unknown>;

  onData(callback: (data: Uint8Array) => void): void;
}

class WebUsbAdapter implements UsbAdapter {
  constructor(readonly nDevice: USBDevice) {}

  async open() {
    return await this.nDevice.open();
  }

  async claimInterface(interfaceId: number) {
    return await this.nDevice.claimInterface(interfaceId);
  }

  async transferOut(endpointId: number, data: Uint8Array) {
    return await this.nDevice.transferOut(endpointId, data);
  }
}

class NodeUsbAdapter implements UsbAdapter {
  nInterface: NodeUsb.Interface | null = null;

  constructor(readonly nDevice: NodeUsb.Device) {}

  async open() {
    return this.nDevice.open();
  }

  async claimInterface(interfaceId: number) {
    this.nInterface = this.nDevice.interface(interfaceId);
    return this.nInterface;
  }

  async transferOut(endpointId: number, data: Uint8Array) {
    if (this.nInterface == null) {
      throw new Error(
        "The NodeUsbAdapter claimInterface method should be called before transferOut"
      );
    }

    const endpoint = this.nInterface.endpoint(
      endpointId
    ) as NodeUsb.OutEndpoint;

    return await new Promise((resolve, reject) => {
      endpoint.transfer(data as Buffer, (error) => {
        if (error != null) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

const WebHidAdapterHandler = Symbol("WebHidAdapterHandler");
class WebHidAdapter implements HidAdapter {
  constructor(readonly nDevice: HIDDevice) {}

  async open() {
    return await this.nDevice.open();
  }

  async write([reportId, ...data]: Array<number>) {
    return await this.nDevice.sendReport(reportId, new Uint8Array(data));
  }

  onData(callback: (data: Uint8Array) => void) {
    const handler = ({ reportId, data }: HIDInputReportEvent) => {
      const tmp = new Uint8Array(data.byteLength + 1);
      tmp.set([reportId], 0);
      tmp.set(new Uint8Array(data.buffer), 1);
      callback(tmp);
    };

    // keep the handler around because the device seems to not hold a strong
    // reference to it which allows Chrome to garbage collect it
    // cf. https://bugs.chromium.org/p/chromium/issues/detail?id=890096#c51
    ((globalThis as unknown) as { [WebHidAdapterHandler]: unknown })[
      WebHidAdapterHandler
    ] = handler;

    this.nDevice.addEventListener("inputreport", handler);
  }
}

class NodeHidAdapter implements HidAdapter {
  constructor(readonly nDevice: NodeHid.HID) {
    this.nDevice.on("error", console.error);
  }

  async open() {
    return Promise.resolve(undefined);
  }

  async write(data: Array<number>) {
    return this.nDevice.write(data);
  }

  onData(callback: (data: Uint8Array) => void) {
    this.nDevice.on("data", callback);
  }
}

export const requestUsbDevice = async (
  vendorId: number,
  productId: number,
  runtime: "node" | "web"
) =>
  runtime === "node"
    ? new NodeUsbAdapter(NodeUsb.findByIds(vendorId, productId))
    : new WebUsbAdapter(
        await navigator.usb.requestDevice({
          filters: [{ vendorId, productId }],
        })
      );

export const requestHidDevice = async (
  vendorId: number,
  productId: number,
  runtime: "node" | "web"
) =>
  runtime === "node"
    ? new NodeHidAdapter(new NodeHid.HID(vendorId, productId))
    : new WebHidAdapter(
        (
          await navigator.hid.requestDevice({
            filters: [{ vendorId, productId }],
          })
        )[0]
      );
